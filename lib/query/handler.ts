import type { Node } from '../parser/types';
import { clone } from '../util/clone';

export function safeHandler<Ctx, T extends Node = Node>(
  handler: ((ctx: Ctx, token: T) => Ctx) | null | undefined
): (ctx: Ctx, token: T) => Ctx {
  return handler
    ? (context, token) => handler(clone(context), token)
    : (context, _) => context;
}
