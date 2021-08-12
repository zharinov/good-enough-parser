import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'upath';

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

export function getName(): string {
  return getCallerFileName()
    .replace(/\\/g, '/')
    .replace(/^test\//, '')
    .replace(/\.spec\.ts$/, '');
}

export function getSamplePath(sampleFile: string, sampleRoot = '.'): string {
  const callerFile = getCallerFileName();
  const callerDir = dirname(callerFile);
  return join(callerDir, sampleRoot, '__samples__', sampleFile);
}

export function loadInputTxt(sampleFile: string, sampleRoot = '.'): string {
  const sampleAbsFile = getSamplePath(sampleFile, sampleRoot);
  return readFileSync(sampleAbsFile, { encoding: 'utf8' });
}

export function loadInputJson<T>(sampleFile: string, sampleRoot = '.'): T {
  const rawSample = loadInputTxt(sampleFile, sampleRoot);
  return JSON.parse(rawSample) as T;
}

export function loadOutputJson<T>(
  sampleFile: string,
  currentOutput: T,
  sampleRoot = '.'
): T {
  try {
    return loadInputJson<T>(sampleFile, sampleRoot);
  } catch (err) {
    const path = getSamplePath(sampleFile, sampleRoot);
    const newOutput = JSON.stringify(currentOutput, null, 2);
    writeFileSync(path, newOutput);
    return currentOutput;
  }
}
