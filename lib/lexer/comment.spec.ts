/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { loadInputTxt, loadOutputJson, tokenize } from '../../test/test-utils';
import { configComments } from './comment';
import { fallbackRule } from './rules';
import type { CommentOption, StatesMap } from './types';

describe('lexer/comment', () => {
  const states: StatesMap = {
    $: { unknown: { ...fallbackRule, type: 'unknown' } },
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
