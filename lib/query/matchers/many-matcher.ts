import type { Checkpoint, ManyMatcherOptions, Matcher } from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class ManyMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly manyOf: Matcher<Ctx>;
  readonly min: number;
  readonly max: number | null;

  private idx = 0;
  private matches: Checkpoint<Ctx>[] = [];

  constructor({ matcher, min, max }: ManyMatcherOptions<Ctx>) {
    super();

    if (min < 0) {
      throw new Error(`Invalid minimal bound: ${min}`);
    }

    if (max !== null && min > max) {
      throw new Error(`Invalid boundaries: ${min} > ${max}`);
    }

    this.manyOf = matcher;
    this.min = min;
    this.max = max;
  }

  private nextRound(checkpoints: Checkpoint<Ctx>[]): Checkpoint<Ctx>[] {
    const results: Checkpoint<Ctx>[] = [];
    for (const oldCheckpoint of checkpoints) {
      const newCheckpoint = this.manyOf.match(oldCheckpoint);
      if (!newCheckpoint) {
        continue;
      }

      const matchResults: Checkpoint<Ctx>[] = [newCheckpoint];
      let nextResult = this.manyOf.nextMatch();
      while (nextResult) {
        matchResults.push(nextResult);
        nextResult = this.manyOf.nextMatch();
      }
      results.unshift(...matchResults);
    }
    return results;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.idx = 0;

    let roundResults = [checkpoint];
    this.matches = this.min === 0 ? [checkpoint] : [];

    let round = 1;
    while (this.max !== null ? round <= this.max : true) {
      roundResults = this.nextRound(roundResults);
      if (roundResults.length) {
        this.matches.unshift(...roundResults);
        round += 1;
      } else {
        break;
      }
    }

    return this.matches[this.idx] ?? null;
  }

  override nextMatch(): Checkpoint<Ctx> | null {
    this.idx += 1;
    return this.matches[this.idx] ?? null;
  }
}
