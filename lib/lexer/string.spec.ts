/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { fallbackRule } from '../../lib/lexer/rules';
import { configStrings } from '../../lib/lexer/string';
import type { StatesMap, StringOption } from '../../lib/lexer/types';
import { loadInputTxt, loadOutputJson, tokenize } from '../../test/test-utils';

describe('lexer/string', () => {
  describe('configuration', () => {
    it('handles empty options list', () => {
      const states: StatesMap = { $: { foo: { t: 'string', match: 'bar' } } };
      const res = configStrings(states, []);
      expect(res).toBe(states);
    });

    it('supports string option', () => {
      const states = { $: {} };
      const opts: StringOption[] = [{ startsWith: '"' }];
      const res = configStrings(states, opts);
      expect(res).toMatchObject({
        $: {
          str$0$start: { match: '"', push: 'str$0$state' },
        },
        str$0$state: {
          str$0$end: { match: '"', pop: 1 },
          str$0$value: fallbackRule,
        },
      });
    });

    it('supports multiple string variants', () => {
      const states = { $: {} };
      const opts: StringOption[] = [
        { startsWith: '"' },
        { startsWith: '"""' },
        { startsWith: "'" },
        { startsWith: "'''" },
      ];

      const res = configStrings(states, opts);

      expect(res).toMatchObject({
        $: {
          str$0$start: { match: '"', push: 'str$0$state' },
          str$1$start: { match: '"""', push: 'str$1$state' },
          str$2$start: { match: "'", push: 'str$2$state' },
          str$3$start: { match: "'''", push: 'str$3$state' },
        },
        str$0$state: {
          str$0$end: { match: '"', pop: 1 },
          str$0$value: fallbackRule,
        },
        str$1$state: {
          str$1$end: { match: '"""', pop: 1 },
          str$1$value: fallbackRule,
        },
        str$2$state: {
          str$2$end: { match: "'", pop: 1 },
          str$2$value: fallbackRule,
        },
        str$3$state: {
          str$3$end: { match: "'''", pop: 1 },
          str$3$value: fallbackRule,
        },
      });

      expect(Object.keys(res.$)).toMatchObject([
        'str$3$start',
        'str$2$start',
        'str$1$start',
        'str$0$start',
      ]);
    });

    it('supports expression templates', () => {
      const states: StatesMap = {
        $: {
          curly$left: { t: 'string', match: '{' },
          curly$right: { t: 'string', match: '}' },
        },
      };

      const opts: StringOption[] = [
        {
          startsWith: '`',
          templates: [{ type: 'expr', startsWith: '${', endsWith: '}' }],
        },
      ];

      expect(configStrings(states, opts)).toMatchObject({
        $: {
          curly$left: {
            match: '{',
          },
          curly$right: {
            match: '}',
          },
          str$0$start: {
            match: '`',
            push: 'str$0$state',
          },
        },
        str$0$state: {
          str$0$end: {
            match: '`',
            pop: 1,
          },
          str$0$tpl$0$start: {
            match: '${',
            push: 'str$0$tpl$0$state',
          },
          str$0$value: fallbackRule,
        },
        str$0$tpl$0$state: {
          curly$left: {
            match: '{',
          },
          str$0$start: {
            match: '`',
            push: 'str$0$state',
          },
          str$0$tpl$0$end: {
            match: '}',
            pop: 1,
          },
        },
      });
    });
  });

  it('supports variable templates', () => {
    const states: StatesMap = {
      $: {
        foo: { t: 'string', match: 'foo' },
        bar: { t: 'string', match: 'bar' },
      },
    };

    const opts: StringOption[] = [
      {
        startsWith: '"',
        templates: [{ startsWith: '$', type: 'var', allowedTokens: ['foo'] }],
      },
    ];

    expect(configStrings(states, opts)).toMatchObject({
      $: {
        bar: {
          match: 'bar',
        },
        foo: {
          match: 'foo',
        },
        str$0$start: {
          match: '"',
          push: 'str$0$state',
        },
      },
      str$0$state: {
        str$0$end: {
          match: '"',
          pop: 1,
        },
        str$0$tpl$0$start: {
          match: '$',
          push: 'str$0$tpl$0$state',
        },
        str$0$value: {
          fallback: true,
        },
      },
      str$0$tpl$0$state: {
        foo: {
          match: 'foo',
        },
        str$0$end: {
          match: '"',
          pop: 1,
        },
        str$0$tpl$0$start: {
          match: '$',
          push: 'str$0$tpl$0$state',
        },
        str$0$value: {
          fallback: true,
        },
      },
    });
  });

  describe('tokenize', () => {
    describe('simple strings', () => {
      const states: StatesMap = {
        $: {
          unknown: fallbackRule,
        },
      };
      const opts: StringOption[] = [
        { startsWith: '"' },
        { startsWith: "'" },
        { startsWith: '"""' },
        { startsWith: "'''" },
      ];
      const rules = configStrings(states, opts);

      test.each`
        sampleName
        ${'string/double-quotes'}
        ${'string/single-quotes'}
        ${'string/triple-double-quotes'}
        ${'string/triple-single-quotes'}
      `('$sampleName', ({ sampleName }) => {
        const input = loadInputTxt(sampleName);
        const res = tokenize(rules, input);
        const expectedRes = loadOutputJson(sampleName, res);
        expect(res).toEqual(expectedRes);
      });
    });

    describe('templates', () => {
      const states: StatesMap = {
        $: {
          bracket$1$left: { t: 'string', match: '{{{' },
          bracket$1$right: { t: 'string', match: '}}}' },
          bracket$0$left: { t: 'string', match: '{' },
          bracket$0$right: { t: 'string', match: '}' },
        },
      };
      const opts: StringOption[] = [
        {
          startsWith: '"',
          templates: [
            { type: 'expr', startsWith: '{', endsWith: '}' },
            { type: 'expr', startsWith: '{{{', endsWith: '}}}' },
          ],
        },
      ];
      const rules = configStrings(states, opts);

      test.each`
        sampleName
        ${'string/expr-template'}
        ${'string/expr-template-blocks-1'}
        ${'string/expr-template-blocks-2'}
        ${'string/expr-template-blocks-3'}
      `('$sampleName', ({ sampleName }) => {
        const input = loadInputTxt(sampleName);
        const res = tokenize(rules, input);
        const expectedRes = loadOutputJson(sampleName, res);
        expect(res).toEqual(expectedRes);
      });
    });
  });
});
