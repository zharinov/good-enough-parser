import deepFreeze from 'deep-freeze-es6';
import * as rfdc from 'rfdc';
import { Checkpoint } from './types';

export function freeze<T>(input: T): T {
  return deepFreeze<T>(input);
}

export const clone = rfdc({ proto: false, circles: true });

export function freezeCheckpoint<Ctx>(
  checkpoint: Checkpoint<Ctx>
): Checkpoint<Ctx> {
  return freeze<Checkpoint<Ctx>>({
    ...checkpoint,
    context: freeze<Ctx>(checkpoint.context),
  });
}
