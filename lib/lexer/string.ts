import {
  fallbackRule,
  sortStatesMap,
  StateDefinition,
  StatesMap,
} from './rules';
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

function exprTplState(
  $: StateDefinition,
  { tplEndToken, tplEnd }: ExprTplStateInput
): StateDefinition {
  const result: StateDefinition = {};
  for (const [ruleName, rule] of Object.entries($)) {
    if (rule.t === 'string' && rule.match === tplEnd) {
      result[tplEndToken] = { t: 'string', match: tplEnd, pop: 1 };
    } else {
      result[ruleName] = { ...rule };
    }
  }
  return result;
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
      result[key] = { ...val, next: tplStateName };
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

  const $ = { ...states.$ };

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
    tplStates[tplStateName] = exprTplState($, exprTplStateInput);
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
