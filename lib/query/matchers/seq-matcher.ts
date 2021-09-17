import type { Checkpoint, Matcher, SeqMatcherOptions } from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class SeqMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly seq: Matcher<Ctx>[];
  readonly length: number;

  private checkpoint: Checkpoint<Ctx> | null = null;
  private idx = 0;

  constructor({ matchers }: SeqMatcherOptions<Ctx>) {
    super();
    this.seq = matchers;
    this.length = this.seq.length;
  }

  private isMatchingComplete(): boolean {
    return this.idx === this.length;
  }

  private matchForward(): Checkpoint<Ctx> | null {
    if (this.checkpoint) {
      while (this.idx < this.length) {
        const matcher = this.seq[this.idx] as Matcher<Ctx>;

        const checkpoint = matcher.match(this.checkpoint);
        if (!checkpoint) {
          break;
        }

        this.checkpoint = checkpoint;
        this.idx += 1;
      }

      if (this.isMatchingComplete()) {
        return this.checkpoint;
      }
    }

    return null;
  }

  private backtrack(): Checkpoint<Ctx> | null {
    while (this.idx > 0) {
      this.idx -= 1;
      const matcher = this.seq[this.idx] as Matcher<Ctx>;
      const match = matcher.nextMatch();
      if (match) {
        this.checkpoint = match;
        this.idx += 1;
        return match;
      }
    }

    return null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.idx = 0;
    this.checkpoint = checkpoint;
    while (!this.isMatchingComplete()) {
      const forwardMatch = this.matchForward();
      if (!forwardMatch) {
        const backwardMatch = this.backtrack();
        if (!backwardMatch) {
          return null;
        }
      }
    }

    return this.checkpoint;
  }

  override nextMatch(): Checkpoint<Ctx> | null {
    if (!this.backtrack()) {
      return null;
    }

    while (!this.isMatchingComplete()) {
      const forwardMatch = this.matchForward();
      if (!forwardMatch) {
        const backwardMatch = this.backtrack();
        if (!backwardMatch) {
          return null;
        }
      }
    }

    return this.checkpoint;
  }
}
