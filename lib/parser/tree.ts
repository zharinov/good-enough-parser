import type {
  EndToken,
  Lexer,
  StartToken,
  Token,
  WhitespaceToken,
} from '../lexer/types';
import type { Node, ParserConfig, RootTree, Tree } from './types';

type IndentMode = 'on' | 'off';

function specialToken(
  type: '_start' | '_end',
  prevToken?: Token,
  nextToken?: Token
): StartToken | EndToken {
  const lineBreaks = 0;

  if (nextToken) {
    return {
      type,
      value: '',
      offset: nextToken.offset,
      line: nextToken.line,
      col: nextToken.col,
      lineBreaks,
    };
  }

  if (prevToken) {
    return {
      type,
      value: '',
      offset: prevToken.offset + prevToken.value.length,
      line: prevToken.line + prevToken.lineBreaks,
      col: prevToken.value.length - prevToken.value.lastIndexOf('\n'),
      lineBreaks,
    };
  }

  return { type, value: '', offset: 0, line: 1, col: 1, lineBreaks };
}

export function createTree(lexer: Lexer, config: ParserConfig): RootTree {
  const stack: Tree[] = [];
  let prevToken: Token = specialToken('_start');
  let currentTree: Tree = { type: 'root-tree', children: [prevToken] };

  const { useIndentBlocks } = config;
  let indentMode: IndentMode = 'on';
  let currIndent = '';
  const indents: string[] = [];
  let indentSpaces: WhitespaceToken[] = [];

  let nestingCounter = 0;

  for (const token of lexer) {
    if (!currentTree.children.length) {
      currentTree.children.push(specialToken('_start', prevToken, token));
    }

    if (useIndentBlocks && nestingCounter === 0) {
      if (token.type === 'newline') {
        currIndent = '';
        indentMode = 'on';
      } else if (indentMode === 'on') {
        if (token.type === 'whitespace') {
          currIndent += token.value;
          indentSpaces.push(token);
          prevToken = token;
          continue;
        } else {
          let prevIndent = indents.pop();
          if (
            prevIndent
              ? prevIndent !== currIndent && currIndent.startsWith(prevIndent)
              : currIndent
          ) {
            if (prevIndent) {
              indents.push(prevIndent);
            }
            indents.push(currIndent);
            stack.push(currentTree);
            currentTree = {
              type: 'block-tree',
              children: [
                specialToken('_start', prevToken, token),
                ...indentSpaces,
              ],
            };
          } else if (currentTree.type === 'block-tree') {
            while (
              prevIndent &&
              prevIndent !== currIndent &&
              prevIndent.startsWith(currIndent)
            ) {
              const prevTree = stack.pop();
              if (prevTree) {
                currentTree.children.push(
                  specialToken('_end', prevToken, token)
                );
                prevTree.children.push(currentTree);
                currentTree = prevTree;
              }
              prevIndent = indents.pop();
            }
            indents.push(currIndent);
            currentTree.children.push(...indentSpaces);
          }

          indentMode = 'off';
          indentSpaces = [];
        }
      }
    }

    if (token.type === 'bracket-left') {
      stack.push(currentTree);
      currentTree = {
        type: 'wrapped-tree',
        startsWith: token,
        endsWith: { ...token, type: 'bracket-right' },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'bracket-right' &&
      currentTree.type === 'wrapped-tree'
    ) {
      currentTree.children.push(specialToken('_end', prevToken, token));
      currentTree.endsWith = token;
      const prevTree = stack.pop();
      if (prevTree) {
        prevTree.children.push(currentTree);
        currentTree = prevTree;
      }
      nestingCounter -= 1;
    } else if (token.type === 'string-start') {
      stack.push(currentTree);
      currentTree = {
        type: 'string-tree',
        startsWith: token,
        endsWith: { ...token, type: 'string-end' },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'string-end' &&
      currentTree.type === 'string-tree'
    ) {
      currentTree.children.push(specialToken('_end', prevToken, token));
      currentTree.endsWith = token;
      const prevTree = stack.pop();
      if (prevTree) {
        prevTree.children.push(currentTree);
        currentTree = prevTree;
      }
      nestingCounter -= 1;
    } else if (token.type === 'template-start') {
      stack.push(currentTree);
      currentTree = {
        type: 'template-tree',
        startsWith: token,
        endsWith: { ...token, type: 'template-end' },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'template-end' &&
      currentTree.type === 'template-tree'
    ) {
      currentTree.children.push(specialToken('_end', prevToken, token));
      currentTree.endsWith = token;
      const prevTree = stack.pop();
      if (prevTree) {
        prevTree.children.push(currentTree);
        currentTree = prevTree;
      }
      nestingCounter -= 1;
    } else {
      currentTree.children.push(token);
    }

    prevToken = token;
  }

  const closingToken = specialToken('_end', prevToken);
  while (currentTree.type !== 'root-tree') {
    currentTree.children.push({ ...closingToken });
    const prevTree = stack.pop();
    if (prevTree) {
      prevTree.children.push(currentTree);
      currentTree = prevTree;
    } else {
      throw new Error('Parsing error');
    }
  }
  currentTree.children.push({ ...closingToken });

  return currentTree;
}

export function isTree(node: Node): node is Tree {
  return [
    'root-tree',
    'wrapped-tree',
    'string-tree',
    'template-tree',
    'block-tree',
  ].includes(node?.type);
}
