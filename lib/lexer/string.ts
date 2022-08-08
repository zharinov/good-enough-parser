import { getCounterpartBracketKey, isBracketKey, isRightKey } from './bracket';
import { fallbackRule } from './rules';
import type {
  LexerRule,
  StateDefinition,
  StatesMap,
  StringOption,
  StringRule,
} from './types';

interface ExprTplStateInput {
  tplEndToken: string;
  tplEnd: string;
  tplStateName: string;
}

interface ExprTplStateOutput {
  $: StateDefinition;
  tplState: StateDefinition;
}

function copyStateDefinition(state: StateDefinition): StateDefinition {
  const result = { ...state };
  Object.entries(result).forEach(([key, val]) => {
    result[key] = { ...val };
  });
  return result;
}

function exprTplStatesMap(
  $: StateDefinition,
  { tplEndToken, tplEnd }: ExprTplStateInput
): ExprTplStateOutput {
  const rootState: StateDefinition = {};
  const tplState: StateDefinition = copyStateDefinition($);

  for (const [bracketKey, bracketRule] of Object.entries(tplState)) {
    if (
      bracketRule.t === 'string' &&
      isBracketKey(bracketKey) &&
      isRightKey(bracketKey) &&
      (bracketRule.match.startsWith(tplEnd) ||
        tplEnd.startsWith(bracketRule.match))
    ) {
      const counterpartKey = getCounterpartBracketKey(bracketKey);
      if (!counterpartKey) {
        throw new Error('String template definition conflicts with brackets');
      }

      const counterpartRule = tplState[counterpartKey];
      if (!counterpartRule || counterpartRule.t !== 'string') {
        throw new Error('String template definition conflicts with brackets');
      }

      delete tplState[bracketKey];
      counterpartRule.push = '$';
      rootState[counterpartKey] = { ...counterpartRule };
      rootState[bracketKey] = { ...bracketRule, pop: 1 };
    }
  }

  const tplEndRule: StringRule = {
    t: 'string',
    type: tplEndToken,
    match: tplEnd,
    chunk: tplEnd,
    pop: 1,
  };
  tplState[tplEndToken] = tplEndRule;

  return { $: rootState, tplState };
}

interface VarTplStateInput {
  symbols?: RegExp;
  operators: string[];
  tplStart: string;
  tplStateName: string;
  strEnd: string;
  strStateName: string;
}

function varTplState(
  $: StateDefinition,
  strState: StateDefinition,
  { operators = [], symbols }: VarTplStateInput
): StateDefinition {
  const result: StateDefinition = { ...strState };

  let strStateName: string | null = null;
  Object.entries(result).forEach(([key, val]) => {
    if (val.t !== 'fallback') {
      const rule = { ...val };
      if (rule.push) {
        rule.next = rule.push;
        delete rule.push;
      }
      result[key] = rule;
    } else {
      delete result[key];
      strStateName = key;
    }
  });

  const symbolRule: LexerRule | undefined = symbols
    ? { t: 'regex', type: 'symbol', match: symbols, chunk: null }
    : $.symbol;
  if (!symbolRule) {
    throw new Error(`String definition isn't found for template definition`);
  }
  result.symbol = symbolRule;

  for (const op of operators) {
    const opEntry = Object.entries($).find(
      ([key, rule]) =>
        key.startsWith('op$') && rule.t === 'string' && rule.match === op
    );
    if (opEntry) {
      const [opKey, opRule] = opEntry;
      result[opKey] = { ...opRule };
    } else {
      throw new Error(`Operator is not found: ${op}`);
    }
  }

  if (strStateName) {
    result[strStateName] = {
      t: 'regex',
      type: strStateName,
      match: /./,
      chunk: null,
      lineBreaks: true,
      pop: 1,
    };
  } else {
    throw new Error(`Fallback value is missing for variable-style template`);
  }

  return result;
}

export function configStrings(
  states: StatesMap,
  opts: StringOption[]
): StatesMap {
  if (!opts.length) {
    return states;
  }

  const $ = copyStateDefinition(states.$);

  const strStates: Record<string, StateDefinition> = {};

  const exprTplPreStates: ExprTplStateInput[] = [];
  const varTplPreStates: VarTplStateInput[] = [];

  opts.forEach((strOpt, strIdx) => {
    const {
      startsWith: strStart,
      endsWith: strEnd = strStart,
      templates: tplOpts,
    } = strOpt;
    const strToken = `str$${strIdx}`;
    const strStartToken = `${strToken}$start`;
    const strEndToken = `${strToken}$end`;
    const strValueToken = `${strToken}$value`;
    const strStateName = `${strToken}$state`;

    const strState: StateDefinition = {
      [strEndToken]: {
        t: 'string',
        type: strEndToken,
        match: strEnd,
        chunk: strEnd,
        pop: 1,
      },
      [strValueToken]: { ...fallbackRule, type: strValueToken },
    };

    tplOpts?.forEach((tplOpt, tplIdx) => {
      const { startsWith: tplStart } = tplOpt;
      const tplToken = `${strToken}$tpl$${tplIdx}`;
      const tplStartToken = `${tplToken}$start`;
      const tplEndToken = `${tplToken}$end`;
      const tplStateName = `${tplToken}$state`;

      if (tplOpt.type === 'expr') {
        strState[tplStartToken] = {
          t: 'string',
          type: tplStartToken,
          match: tplStart,
          chunk: tplStart,
          push: tplStateName,
        };
        const { endsWith: tplEnd } = tplOpt;
        exprTplPreStates.push({ tplStateName, tplEndToken, tplEnd });
      }

      if (tplOpt.type === 'var') {
        strState[tplStartToken] = {
          t: 'string',
          type: tplStartToken,
          match: tplStart,
          chunk: tplStart,
          push: tplStateName,
        };
        const { operators = [], symbols } = tplOpt;
        varTplPreStates.push({
          symbols,
          operators,
          tplStateName,
          tplStart,
          strEnd,
          strStateName,
        });
      }
    });

    strStates[strStateName] = strState;
    $[strStartToken] = {
      t: 'string',
      type: strStartToken,
      match: strStart,
      chunk: strStart,
      push: strStateName,
    };
  });

  const tplStates: Record<string, StateDefinition> = {};
  for (const exprTplStateInput of exprTplPreStates) {
    const { tplStateName } = exprTplStateInput;
    const exprTplStates = exprTplStatesMap($, exprTplStateInput);
    Object.assign($, exprTplStates.$);
    tplStates[tplStateName] = exprTplStates.tplState;
  }
  for (const varTplStateInput of varTplPreStates) {
    const { tplStateName, strStateName } = varTplStateInput;
    const strState = strStates[strStateName];
    if (strState) {
      tplStates[tplStateName] = varTplState($, strState, varTplStateInput);
    }
  }

  return { $, ...strStates, ...tplStates };
}
