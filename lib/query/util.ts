import { klona as clone } from 'klona/json';
import { Node } from '../parser/types';

export { klona as clone } from 'klona/json';

export function coerceHandler<Ctx, T extends Node = Node>(
  handler: ((ctx: Ctx, token: T) => Ctx) | null | undefined
): (ctx: Ctx, token: T) => Ctx {
  return handler
    ? (context, token) => handler(clone(context), token)
    : (context, _) => context;
}
