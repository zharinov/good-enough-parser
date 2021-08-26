import type { Cursor } from './cursor';

export interface Checkpoint<Ctx> {
  cursor: Cursor | undefined;
  context: Ctx;
}
