import { loadSampleJson, loadSampleTxt } from './test-utils';

describe('test-utils', () => {
  it('loadSampleTxt', () => {
    const x = loadSampleTxt('sample.in.txt');
    expect(x).toBeTruthy();
  });

  it('loadSampleJson', () => {
    const x = loadSampleJson('sample.in.json');
    expect(x).toBeTruthy();
  });
});
