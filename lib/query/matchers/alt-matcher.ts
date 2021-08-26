import type { Checkpoint } from '../types/checkpoint';
import type { AltMatcherOption, Matcher } from '../types/matcher';
import { AbstractMatcher } from './abstract-matcher';

export class AltMatcher<Ctx> extends AbstractMatcher<Ctx> {
  private matchers: Matcher<Ctx>[];
  private idx: number;
  private checkpoint: Checkpoint<Ctx> | null;

  constructor({ matchers }: AltMatcherOption<Ctx>) {
    super();
    this.matchers = matchers;
    this.idx = -1;
    this.checkpoint = null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.checkpoint = checkpoint;
    this.idx = -1;
    return this.nextMatch();
  }

  override nextMatch(): Checkpoint<Ctx> | null {
    if (this.checkpoint) {
      this.idx += 1;
      let matcher = this.matchers[this.idx];
      while (matcher) {
        const checkpoint = matcher.match(this.checkpoint);
        if (checkpoint) {
          return checkpoint;
        }

        this.idx += 1;
        matcher = this.matchers[this.idx];
      }
    }

    return null;
  }
}
