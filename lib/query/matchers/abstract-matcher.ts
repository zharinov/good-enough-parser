import { MinorToken } from '../../lexer/types';
import type { Checkpoint, Matcher } from '../types';

export abstract class AbstractMatcher<Ctx> implements Matcher<Ctx> {
  readonly minorToken: MinorToken['type'] | undefined = undefined;

  abstract match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;

  nextMatch(): Checkpoint<Ctx> | null {
    return null;
  }
}
