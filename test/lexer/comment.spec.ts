import { loadInputTxt, loadOutputJson, tokenize } from '#test-utils';
import type { CommentOption } from '/lexer/comment';
import { configComments } from '/lexer/comment';
import type { StatesMap } from '/lexer/rules';
import { fallbackRule } from '/lexer/rules';

describe('lexer/comment', () => {
  const states: StatesMap = {
    $: {
      unknown: fallbackRule,
    },
  };

  const opts: CommentOption[] = [
    { type: 'line-comment', startsWith: '//' },
    { type: 'multiline-comment', startsWith: '/*', endsWith: '*/' },
  ];

  test.each`
    sampleName
    ${'comment/line-comment'}
    ${'comment/multiline-comment'}
  `('$sampleName', ({ sampleName }) => {
    const input = loadInputTxt(sampleName);
    const rules = configComments(states, opts);
    const res = tokenize(rules, input);
    const expectedRes = loadOutputJson(sampleName, res);
    expect(res).toEqual(expectedRes);
  });
});
