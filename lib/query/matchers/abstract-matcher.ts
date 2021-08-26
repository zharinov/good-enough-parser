import type { Checkpoint } from '../types/checkpoint';
import type { Matcher } from '../types/matcher';

export abstract class AbstractMatcher<Ctx> implements Matcher<Ctx> {
  abstract match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;

  nextMatch(): Checkpoint<Ctx> | null {
    return null;
  }
}
