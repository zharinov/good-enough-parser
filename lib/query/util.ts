import deepFreeze from 'deep-freeze-es6';
import * as rfdc from 'rfdc';
import { Checkpoint } from './types/checkpoint';

export function freeze<T>(input: T): T {
  return deepFreeze<T>(input);
}

export const clone = rfdc({ proto: false, circles: true });

export function freezeCheckpoint<Ctx>({
  cursor,
  context,
}: Checkpoint<Ctx>): Checkpoint<Ctx> {
  return freeze<Checkpoint<Ctx>>({
    cursor,
    context: freeze(context),
  });
}
