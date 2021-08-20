import type { Tree } from './types';
import { nextOffset } from '/lexer/token';
import type { Lexer } from '/lexer/types';

export function preprocessTree(lexer: Lexer): Tree {
  const stack: Tree[] = [];
  let currentTree: Tree = { type: 'root-tree', children: [] };

  for (const token of lexer) {
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
    } else {
      currentTree.children.push(token);
    }
  }

  return currentTree;
}
