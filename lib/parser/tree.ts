import { nextOffset } from '../lexer';
import type { Lexer } from '../lexer/types';
import type { Node, ParserConfig, RootTree, Tree } from './types';

export function createTree(lexer: Lexer, _config: ParserConfig): RootTree {
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

  if (currentTree.type !== 'root-tree') {
    throw new Error('Parsing error');
  }

  return currentTree;
}

export function isTree(node: Node): node is Tree {
  return ['root-tree', 'wrapped-tree', 'string-tree', 'template-tree'].includes(
    node.type
  );
}
