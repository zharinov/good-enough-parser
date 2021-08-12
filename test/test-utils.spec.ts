import { existsSync, rmSync } from 'fs';
import {
  getSamplePath,
  loadInputJson,
  loadInputTxt,
  loadOutputJson,
} from './test-utils';

describe('test-utils', () => {
  it('loadInputTxt', () => {
    const x = loadInputTxt('sample');
    expect(x).toEqual('foobar');
  });

  it('loadInputJson', () => {
    const x = loadInputJson<string>('sample');
    expect(x).toEqual('foobar');
  });

  it('loadOutputJson', () => {
    const sampleName = 'sample';
    const sampleFile = 'sample.out.json';

    const outputFile = getSamplePath(sampleFile);
    try {
      rmSync(outputFile);
    } catch (err) {
      // no-op
    } finally {
      expect(existsSync(outputFile)).toBeFalsy();
    }

    const input = loadInputTxt(sampleName);
    const output = loadOutputJson<string>(sampleName, input);
    expect(existsSync(outputFile)).toBeTruthy();
    expect(input).toBe(output);
  });
});
