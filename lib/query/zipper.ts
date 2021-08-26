import { zipper } from '@thi.ng/zipper';
import type { Node, Tree } from '../parser/types';
import type { Cursor } from './types/cursor';

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
