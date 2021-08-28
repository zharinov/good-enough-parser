import { zipper } from '@thi.ng/zipper';
import type { Cursor, Node, Tree } from './types';

export function createCursor(tree: Node): Cursor {
  return zipper<Node>(
    {
      branch: (x) => x.type.endsWith('-tree'),
      children: (x) => (<Tree>x).children,
      factory: (tree, children) => ({ ...tree, children }),
    },
    tree
  );
}
