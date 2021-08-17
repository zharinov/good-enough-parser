import { loadInputTxt, loadOutputJson, tokenize } from '#test-utils';
import { CommentOption, configComments } from '/lexer/comment';
import { fallbackRule, StatesMap } from '/lexer/rules';

describe('lexer/comment', () => {
  const states: StatesMap = {
    $: {
      unknown: fallbackRule,
    },
  };

  const opts: CommentOption[] = [
    { t: 'line-comment', startsWith: '//' },
    { t: 'multiline-comment', startsWith: '/*', endsWith: '*/' },
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
