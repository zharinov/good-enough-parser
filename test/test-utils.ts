import { readFileSync } from 'fs';
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

export function getFixturePath(fixtureFile: string, fixtureRoot = '.'): string {
  const callerFile = getCallerFileName();
  const callerDir = dirname(callerFile);
  return join(callerDir, fixtureRoot, '__fixtures__', fixtureFile);
}

export function loadFixture(fixtureFile: string, fixtureRoot = '.'): string {
  const fixtureAbsFile = getFixturePath(fixtureFile, fixtureRoot);
  return readFileSync(fixtureAbsFile, { encoding: 'utf8' });
}

export function loadJsonFixture<T>(fixtureFile: string, fixtureRoot = '.'): T {
  const rawFixture = loadFixture(fixtureFile, fixtureRoot);
  return JSON.parse(rawFixture) as T;
}
