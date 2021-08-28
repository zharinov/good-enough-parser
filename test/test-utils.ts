import { readFileSync, writeFileSync } from 'fs';
import * as moo from 'moo';
import { dirname, join } from 'upath';
import { coerceToken } from '../lib/lexer/token';
import { StatesMap, Token } from '../lib/lexer/types';

function getCallerFileName(): string {
  let result = null;

  const prepareStackTrace = Error.prepareStackTrace;
  const stackTraceLimit = Error.stackTraceLimit;

  Error.prepareStackTrace = (_err, stack) => stack;
  Error.stackTraceLimit = 5; // max calls inside this file + 1

  const err = new Error();

  const stack = err.stack as unknown as NodeJS.CallSite[];

  let currentFile = null;
  for (const frame of stack) {
    const fileName = frame.getFileName();
    if (!currentFile) {
      currentFile = fileName;
    } else if (currentFile !== fileName) {
      result = fileName;
      break;
    }
  }

  Error.prepareStackTrace = prepareStackTrace;
  Error.stackTraceLimit = stackTraceLimit;

  if (result === null) {
    throw new Error(`Can't detect caller filename`);
  }

  return result;
}

export function getSamplePath(sampleFile: string, sampleRoot = '.'): string {
  const callerFile = getCallerFileName();
  const callerDir = dirname(callerFile);
  return join(callerDir, sampleRoot, '__samples__', sampleFile);
}

export function loadSampleFile(fileName: string, sampleRoot = '.'): string {
  const sampleAbsFile = getSamplePath(fileName, sampleRoot);
  return readFileSync(sampleAbsFile, { encoding: 'utf8' });
}

export function loadInputTxt(sampleName: string, sampleRoot = '.'): string {
  return loadSampleFile(`${sampleName}.in.txt`, sampleRoot);
}

export function loadInputJson<T>(sampleName: string, sampleRoot = '.'): T {
  const rawSample = loadSampleFile(`${sampleName}.in.json`, sampleRoot);
  return JSON.parse(rawSample) as T;
}

export function loadOutputJson<T>(
  sampleName: string,
  testOutput: T,
  sampleRoot = '.'
): T {
  const sampleFile = `${sampleName}.out.json`;

  let result: T = testOutput;

  const writeSamples = () => {
    const path = getSamplePath(sampleFile, sampleRoot);
    const newOutput = JSON.stringify(testOutput, null, 2) + '\n';
    writeFileSync(path, newOutput);
  };

  if (process.env.REWRITE_SAMPLES === 'true') {
    writeSamples();
  } else {
    try {
      const existingOutput = loadSampleFile(sampleFile, sampleRoot);
      result = JSON.parse(existingOutput) as T;
    } catch (err) {
      writeSamples();
    }
  }

  return result;
}

export function tokenize(states: StatesMap, input: string): Token[] {
  const lexer = moo.states(states);
  return [...lexer.reset(input)].map(coerceToken);
}
