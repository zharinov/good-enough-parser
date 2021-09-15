import type { Checkpoint, ManyMatcherOptions, Matcher } from '../types';
import { AbstractMatcher } from './abstract-matcher';
import { skipMinorTokens } from './util';

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
    for (const checkpoint of checkpoints) {
      if (checkpoint.endOfLevel) {
        continue;
      }

      const cursor = skipMinorTokens(checkpoint.cursor, this.manyOf.minorToken);
      const oldCheckpoint = cursor ? { ...checkpoint, cursor } : null;
      if (!oldCheckpoint) {
        continue;
      }

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
    this.matches = [];
    let roundResults = [checkpoint];
    let round = 1;
    while (
      roundResults.length > 0 &&
      (this.max !== null ? round <= this.max : true)
    ) {
      if (round > this.min) {
        this.matches.unshift(...roundResults);
      }

      roundResults = this.nextRound(roundResults);

      round += 1;
    }

    return this.matches[this.idx] ?? null;
  }

  override nextMatch(): Checkpoint<Ctx> | null {
    this.idx += 1;
    return this.matches[this.idx] ?? null;
  }
}
