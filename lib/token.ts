import type { Token as MooToken } from 'moo';
import type { Token } from './types';

export function coerceToken({ type, value, offset }: MooToken): Token {
  return {
    type: type ?? null,
    value,
    offset,
  };
}
