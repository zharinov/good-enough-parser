import type { Checkpoint } from '../types/checkpoint';
import { AbstractMatcher } from './abstract-matcher';
import type { Matcher, SeqMatcherOptions } from './types';
import { skipSpaces } from './util';

export class SeqMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly seq: Matcher<Ctx>[];
  readonly length: number;

  private currentCheckpoint: Checkpoint<Ctx> | null = null;
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
    if (this.currentCheckpoint) {
      while (this.idx < this.length) {
        if (this.currentCheckpoint.endOfLevel) {
          break;
        }

        const oldCheckpoint = skipSpaces(this.currentCheckpoint);
        if (!oldCheckpoint) {
          break;
        }

        const matcher = this.seq[this.idx] as Matcher<Ctx>;

        const newCheckpoint = matcher.match(oldCheckpoint);
        if (!newCheckpoint) {
          break;
        }

        this.currentCheckpoint = newCheckpoint;
        this.idx += 1;
      }

      if (this.isMatchingComplete()) {
        return this.currentCheckpoint;
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
        this.currentCheckpoint = match;
        this.idx += 1;
        return match;
      }
    }

    return null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.idx = 0;
    this.currentCheckpoint = checkpoint;
    while (!this.isMatchingComplete()) {
      const forwardMatch = this.matchForward();
      if (!forwardMatch) {
        const backwardMatch = this.backtrack();
        if (!backwardMatch) {
          return null;
        }
      }
    }

    return this.currentCheckpoint;
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

    return this.currentCheckpoint;
  }
}
