import { getCounterpartBracketKey, isBracketKey, isRightKey } from './bracket';
import type { StateDefinition, StatesMap, StringRule } from './rules';
import { copyStateDefinition, fallbackRule, sortStatesMap } from './rules';
import type { OptionBase } from './types';

export interface VariableTemplateOption extends OptionBase {
  type: 'var';
  allowedTokens: string[];
}

export interface ExpressionTemplateOption extends OptionBase {
  type: 'expr';
  endsWith: string;
}

export type TemplateOption = VariableTemplateOption | ExpressionTemplateOption;

export interface StringOption extends OptionBase {
  endsWith?: string;
  templates?: TemplateOption[];
}

interface ExprTplStateInput {
  tplEndToken: string;
  tplEnd: string;
  tplStateName: string;
}

interface ExprTplStateOutput {
  $: StateDefinition;
  tplState: StateDefinition;
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

  const tplEndRule: StringRule = { t: 'string', match: tplEnd, pop: 1 };
  tplState[tplEndToken] = tplEndRule;

  return { $: rootState, tplState };
}

interface VarTplStateInput {
  allowedTokens: string[];
  tplStart: string;
  tplStateName: string;
  strEnd: string;
  strStateName: string;
}

function varTplState(
  $: StateDefinition,
  strState: StateDefinition,
  { allowedTokens = [], tplStateName }: VarTplStateInput
): StateDefinition {
  const result: StateDefinition = { ...strState };
  Object.entries(result).forEach(([key, val]) => {
    if (val.t !== 'fallback') {
      const { push, pop, next } = val;
      if ([push, pop, next].every((x) => x === undefined)) {
        result[key] = { ...val, next: tplStateName };
      } else {
        result[key] = { ...val };
      }
    } else {
      result[key] = { ...val };
    }
  });

  for (const tokenName of allowedTokens) {
    const rule = $[tokenName];
    if (rule) {
      if (rule.t !== 'fallback') {
        result[tokenName] = { ...rule };
      }
    } else {
      throw new Error(`Wrong element for allowedRules: ${tokenName}`);
    }
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
      [strEndToken]: { t: 'string', match: strEnd, pop: 1 },
      [strValueToken]: fallbackRule,
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
          match: tplStart,
          push: tplStateName,
        };
        const { endsWith: tplEnd } = tplOpt;
        exprTplPreStates.push({ tplStateName, tplEndToken, tplEnd });
      }

      if (tplOpt.type === 'var') {
        strState[tplStartToken] = {
          t: 'string',
          match: tplStart,
          push: tplStateName,
        };
        const { allowedTokens } = tplOpt;
        varTplPreStates.push({
          allowedTokens,
          tplStateName,
          tplStart,
          strEnd,
          strStateName,
        });
      }
    });

    strStates[strStateName] = strState;
    $[strStartToken] = { t: 'string', match: strStart, push: strStateName };
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

  const result = { $, ...strStates, ...tplStates };
  return sortStatesMap(result);
}
