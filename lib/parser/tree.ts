import { nextOffset } from '../lexer';
import type { Lexer, WhitespaceToken } from '../lexer/types';
import type { Node, ParserConfig, RootTree, Tree } from './types';

type IndentMode = 'on' | 'off';

export function createTree(lexer: Lexer, config: ParserConfig): RootTree {
  const stack: Tree[] = [];
  let currentTree: Tree = { type: 'root-tree', children: [] };

  const { useIndentBlocks } = config;
  let indentMode: IndentMode = 'on';
  let currIndent = '';
  const indents: string[] = [];
  let indentSpaces: WhitespaceToken[] = [];

  let nestingCounter = 0;

  for (const token of lexer) {
    if (useIndentBlocks && nestingCounter === 0) {
      if (token.type === 'newline') {
        currIndent = '';
        indentMode = 'on';
      } else if (indentMode === 'on') {
        if (token.type === 'whitespace') {
          currIndent += token.value;
          indentSpaces.push(token);
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
            currentTree = { type: 'block-tree', children: [...indentSpaces] };
          } else if (currentTree.type === 'block-tree') {
            while (
              prevIndent &&
              prevIndent !== currIndent &&
              prevIndent.startsWith(currIndent)
            ) {
              const prevTree = stack.pop();
              if (prevTree) {
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
        endsWith: {
          type: 'bracket-right',
          offset: nextOffset(token),
          value: '',
        },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'bracket-right' &&
      currentTree.type === 'wrapped-tree'
    ) {
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
        endsWith: {
          type: 'string-end',
          offset: nextOffset(token),
          value: '',
        },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'string-end' &&
      currentTree.type === 'string-tree'
    ) {
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
        endsWith: {
          type: 'template-end',
          offset: nextOffset(token),
          value: '',
        },
        children: [],
      };
      nestingCounter += 1;
    } else if (
      token.type === 'template-end' &&
      currentTree.type === 'template-tree'
    ) {
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
  }

  while (currentTree.type !== 'root-tree') {
    const prevTree = stack.pop();
    if (prevTree) {
      prevTree.children.push(currentTree);
      currentTree = prevTree;
    } else {
      throw new Error('Parsing error');
    }
  }

  return currentTree;
}

export function isTree(node: Node): node is Tree {
  return [
    'root-tree',
    'wrapped-tree',
    'string-tree',
    'template-tree',
    'block-tree',
  ].includes(node.type);
}
