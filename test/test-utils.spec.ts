import { rmSync, existsSync } from 'fs';
import {
  getSamplePath,
  loadInputJson,
  loadInputTxt,
  loadOutputJson,
} from './test-utils';

describe('test-utils', () => {
  it('loadInputTxt', () => {
    const x = loadInputTxt('sample.in.txt');
    expect(x).toBeTruthy();
  });

  it('loadInputJson', () => {
    const x = loadInputJson<string>('sample.out.json');
    expect(x).toBeTruthy();
  });

  it('loadOutputJson', () => {
    const inputName = 'sample.in.txt';
    const outputName = 'sample.out.json';
    const outputFile = getSamplePath(outputName);

    try {
      rmSync(outputFile);
    } catch (err) {
      // no-op
    } finally {
      expect(existsSync(outputFile)).toBeFalsy();
    }

    const input = loadInputTxt(inputName);
    const output = loadOutputJson<string>(outputName, input);
    expect(existsSync(outputFile)).toBeTruthy();
    expect(input).toBe(output);
  });
});
