import type { Checkpoint } from '../types/checkpoint';
import type { ManyMatcherOptions, Matcher } from '../types/matcher';
import { AbstractMatcher } from './abstract-matcher';

export class ManyMatcher<Ctx> extends AbstractMatcher<Ctx> {
  private matcher: Matcher<Ctx>;

  private min: number;

  private max: number | null;

  private idx: number;

  private matches: Checkpoint<Ctx>[] = [];

  constructor({ matcher, min, max }: ManyMatcherOptions<Ctx>) {
    super();

    this.matcher = matcher;
    this.min = min;
    this.max = max;

    this.idx = 0;

    if (min < 0) {
      throw new Error(`Invalid minimal bound: ${min}`);
    }

    if (max !== null && min > max) {
      throw new Error(`Invalid boundaries: ${min} > ${max}`);
    }
  }

  private nextRound(checkpoints: Checkpoint<Ctx>[]): Checkpoint<Ctx>[] {
    const results: Checkpoint<Ctx>[] = [];
    checkpoints.forEach((checkpoint) => {
      const match = this.matcher.match(checkpoint);
      if (match) {
        const matchResults: Checkpoint<Ctx>[] = [match];
        let nextResult = this.matcher.nextMatch();
        while (nextResult) {
          matchResults.push(nextResult);
          nextResult = this.matcher.nextMatch();
        }
        results.unshift(...matchResults);
      }
    }, []);
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
