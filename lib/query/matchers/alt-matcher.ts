import type { AltMatcherOptions, Checkpoint, Matcher } from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class AltMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly alts: Matcher<Ctx>[];

  private idx = -1;
  private checkpoint: Checkpoint<Ctx> | null = null;

  constructor({ matchers }: AltMatcherOptions<Ctx>) {
    super();
    this.alts = matchers;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.checkpoint = checkpoint;
    this.idx = -1;
    return this.nextMatch();
  }

  override nextMatch(): Checkpoint<Ctx> | null {
    if (this.checkpoint) {
      this.idx += 1;
      let matcher = this.alts[this.idx];
      while (matcher) {
        const checkpoint = matcher.match(this.checkpoint);
        if (checkpoint) {
          return checkpoint;
        }

        this.idx += 1;
        matcher = this.alts[this.idx];
      }
    }

    return null;
  }
}
