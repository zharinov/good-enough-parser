import type { Cursor } from './cursor';

export interface Checkpoint<Ctx> {
  cursor: Cursor;
  context: Ctx;
  endOfLevel?: true;
}
