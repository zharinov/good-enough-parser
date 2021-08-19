import type { Token as MooToken } from 'moo';

export interface Token {
  type: string;
  value: string;
  offset: number;
}

export function coerceToken({ type, value, offset }: MooToken): Token {
  return {
    type: type ?? '___',
    value,
    offset,
  };
}
