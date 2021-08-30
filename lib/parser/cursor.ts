import { zipper } from '@thi.ng/zipper';
import { isTree } from './tree';
import type { Cursor, Node, Tree } from './types';

export function createCursor(tree: Node): Cursor {
  return zipper<Node>(
    {
      branch: isTree,
      children: (x) => (<Tree>x).children,
      factory: (tree, children) => ({ ...tree, children }),
    },
    tree
  );
}
