import type { MinorToken } from '../lexer/types';
import type { Node } from './types';

export * from './cursor';
export * from './tree';
export * from './types';

export function isMinorToken(node: Node): node is MinorToken {
  return ['newline', 'whitespace', 'comment'].includes(node?.type);
}
