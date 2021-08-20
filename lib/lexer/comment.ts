import { sortStateRules } from './rules';
import type {
  CommentOption,
  RegexRule,
  StateDefinition,
  StatesMap,
} from './types';

export function esc(input: string): string {
  return input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function configComments(
  states: StatesMap,
  opts: CommentOption[]
): StatesMap {
  const commentRules: StateDefinition = {};
  opts.forEach((option, idx) => {
    const tokenName = `comment$${idx}`;
    const start = esc(option.startsWith);
    if (option.type === 'line-comment') {
      const anyChars = '.*?';
      const rule: RegexRule = {
        t: 'regex',
        match: new RegExp(`${start}${anyChars}$`),
      };
      commentRules[tokenName] = rule;
    } else if (option.type === 'multiline-comment') {
      const anyChars = '[^]*?';
      const end = esc(option.endsWith);
      const rule: RegexRule = {
        t: 'regex',
        match: new RegExp(`${start}${anyChars}${end}`),
        lineBreaks: true,
      };
      commentRules[tokenName] = rule;
    }
  });

  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      ...commentRules,
    }),
  };
}
