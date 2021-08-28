import type { Checkpoint, Matcher } from '../types';

export abstract class AbstractMatcher<Ctx> implements Matcher<Ctx> {
  abstract match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;

  nextMatch(): Checkpoint<Ctx> | null {
    return null;
  }
}
