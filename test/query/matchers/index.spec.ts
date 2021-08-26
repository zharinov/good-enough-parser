import { lexerConfig as pythonConfig } from '/lang/python';
import { createLexer } from '/lexer';
import { preprocessTree } from '../../../lib/parser/tree';
import {
  ManyMatcher,
  OpMatcher,
  SeqMatcher,
  SymMatcher,
} from '/query/matchers';
import { createCursor } from '/query/zipper';

const lexer = createLexer(pythonConfig);

function startCursor(input: string) {
  lexer.reset(input);
  const tree = preprocessTree(lexer);
  const cursor = createCursor(tree).next;
  return cursor;
}

describe('query/matchers/index', () => {
  const handler = (x: number) => x + 1;

  it('SeqMatcher', () => {
    const cursor = startCursor('foo.bar');
    const matcher = new SeqMatcher({
      matchers: [
        new SymMatcher({ matcher: /.*/, handler }),
        new OpMatcher({ matcher: '.', handler }),
        new SymMatcher({ matcher: /.*/, handler }),
      ],
    });
    const { cursor: newCursor, context } =
      matcher.match({
        cursor,
        context: 0,
      }) ?? {};
    expect(context).toEqual(3);
    expect(newCursor).toBeUndefined();
  });

  it('ManyMatcher', () => {
    const cursor = startCursor('...');
    const matcher = new ManyMatcher({
      min: 0,
      max: null,
      matcher: new OpMatcher({ matcher: '.', handler }),
    });

    const checkpoint = matcher.match({
      cursor,
      context: 0,
    });
    expect(checkpoint).not.toBeNull();
    expect(checkpoint?.context).toEqual(3);
    expect(checkpoint?.cursor).toBeUndefined();
  });

  it('backtracking', () => {
    const cursor = startCursor('...baz');
    const matcher = new SeqMatcher({
      matchers: [
        new ManyMatcher({
          min: 0,
          max: null,
          matcher: new OpMatcher({ matcher: '.', handler }),
        }),
        new SeqMatcher({
          matchers: [
            new OpMatcher({ matcher: '.' }),
            new SymMatcher<number>({
              matcher: 'baz',
            }),
          ],
        }),
      ],
    });
    const checkpoint = matcher.match({
      cursor,
      context: 0,
    });
    expect(checkpoint).not.toBeNull();
    expect(checkpoint?.context).toEqual(2);
    expect(checkpoint?.cursor).toBeUndefined();
  });
});
