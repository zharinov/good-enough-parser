import type { Checkpoint } from '../types/checkpoint';
import type { Matcher, SeqMatcherOptions } from '../types/matcher';
import { AbstractMatcher } from './abstract-matcher';

export class SeqMatcher<Ctx> extends AbstractMatcher<Ctx> {
  private readonly matchers: Matcher<Ctx>[];

  private readonly length: number;

  private currentCheckpoint: Checkpoint<Ctx> | null;

  private idx: number;

  constructor({ matchers }: SeqMatcherOptions<Ctx>) {
    super();
    this.matchers = matchers;
    this.length = this.matchers.length;
    this.currentCheckpoint = null;
    this.idx = 0;
  }

  private isMatchComplete(): boolean {
    return this.idx === this.length;
  }

  private matchForward(): Checkpoint<Ctx> | null {
    if (this.currentCheckpoint) {
      while (this.idx < this.length) {
        const matcher = this.matchers[this.idx] as Matcher<Ctx>;
        const newCheckpoint = matcher.match(this.currentCheckpoint);
        if (!newCheckpoint) {
          break;
        }
        this.currentCheckpoint = newCheckpoint;
        this.idx += 1;
      }

      if (this.isMatchComplete()) {
        return this.currentCheckpoint;
      }
    }

    return null;
  }

  private backtrack(): Checkpoint<Ctx> | null {
    while (this.idx > 0) {
      this.idx -= 1;
      const matcher = this.matchers[this.idx] as Matcher<Ctx>;
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
    while (!this.isMatchComplete()) {
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

    while (!this.isMatchComplete()) {
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
