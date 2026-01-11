import { clone } from '../util/clone';
import { escape } from '../util/regex';
import { getCounterpartBracketKey, isBracketKey, isRightKey } from './bracket';
import { fallbackRule } from './rules';
import type {
  RegexRule,
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
  const result = clone(state);
  Object.entries(result).forEach(([key, val]) => {
    result[key] = clone(val);
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
      rootState[counterpartKey] = clone(counterpartRule);
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

  const tplStates: Record<string, StateDefinition> = {};

  opts.forEach((strOpt, strIdx) => {
    const {
      startsWith: strStart,
      endsWith: strEnd = strStart,
      escapeChar,
      templates: tplOpts,
    } = strOpt;
    const strToken = `str$${strIdx}`;
    const strStartToken = `${strToken}$start`;
    const strEndToken = `${strToken}$end`;
    const strValueToken = `${strToken}$value`;
    const strStateName = `${strToken}$state`;

    const strState: StateDefinition = {
      ...(escapeChar && strEnd[0]
        ? {
            // 1. Escape the escape character (e.g. \\) to prevent it from escaping the delimiter
            [`${strToken}$escape_bs`]: {
              t: 'string',
              type: strValueToken,
              match: `${escapeChar}${escapeChar}`,
              chunk: `${escapeChar}${escapeChar}`,
            },
            // 2. Escape the delimiter (e.g. \")
            [`${strToken}$escape`]: {
              t: 'string',
              type: strValueToken,
              match: `${escapeChar}${strEnd[0]}`,
              chunk: `${escapeChar}${strEnd[0]}`,
            },
          }
        : {}),
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

      if (tplOpt.type === 'expr') {
        const tplToken = `${strToken}$tpl$${tplIdx}`;
        const tplStartToken = `${tplToken}$start`;
        const tplEndToken = `${tplToken}$end`;
        const tplStateName = `${tplToken}$state`;

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
        const tplToken = `${strToken}$tpl$${tplIdx}`;
        const tplStartToken = `${tplToken}$start`;
        const tplTokenName = `${tplToken}$token`;

        const { operators = [], symbols } = tplOpt;
        let symRegex = symbols;
        if (!symRegex && $.symbol?.t === 'regex') {
          symRegex = $.symbol.match;
        }
        if (!symRegex) {
          throw new Error(
            `String definition isn't found for template definition`
          );
        }
        const start = escape(tplStart);
        const symSource = symRegex.source;
        let varTplSource = `${start}${symSource}`;
        const opRules: Record<string, StringRule> = {};
        if (operators.length) {
          const opSource = `(?:${operators.map(escape).join('|')})`;
          varTplSource += `(?:${opSource}${symSource})*`;
          operators.forEach((match, idx) => {
            const type = `op$${idx}`;
            opRules[type] = {
              t: 'string',
              type,
              match,
              chunk: match,
            };
          });
        }
        const match = new RegExp(varTplSource);

        strState[tplTokenName] = {
          t: 'regex',
          type: tplTokenName,
          match,
          chunk: tplStart,
        };

        const tplStartRule: StringRule = {
          t: 'string',
          type: tplStartToken,
          match: tplStart,
          chunk: tplStart,
        };

        const symbolRule: RegexRule = {
          t: 'regex',
          type: 'symbol',
          match: symRegex,
          chunk: null,
        };

        tplStates[tplTokenName] = {
          [tplStartToken]: tplStartRule,
          symbol: symbolRule,
          ...opRules,
        };
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

  for (const exprTplStateInput of exprTplPreStates) {
    const { tplStateName } = exprTplStateInput;
    const exprTplStates = exprTplStatesMap($, exprTplStateInput);
    Object.assign($, exprTplStates.$);
    tplStates[tplStateName] = exprTplStates.tplState;
  }

  return { $, ...strStates, ...tplStates };
}
