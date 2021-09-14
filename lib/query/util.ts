import deepFreeze from 'deep-freeze-es6';
import { Node } from '../parser/types';
import { Checkpoint } from './types';

export { klona as clone } from 'klona/json';

export function freeze<T>(input: T): T {
  return deepFreeze<T>(input);
}

export function freezeCheckpoint<Ctx>(
  checkpoint: Checkpoint<Ctx>
): Checkpoint<Ctx> {
  return freeze<Checkpoint<Ctx>>({
    ...checkpoint,
    context: freeze<Ctx>(checkpoint.context),
  });
}

export function coerceHandler<Ctx, T extends Node = Node>(
  handler: ((ctx: Ctx, token: T) => Ctx) | null | undefined
): (ctx: Ctx, token: T) => Ctx {
  return handler
    ? (context, token) => handler(freeze(context), token)
    : (context, _) => context;
}
