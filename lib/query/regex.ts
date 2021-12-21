export function isRegex(input: unknown): input is RegExp {
  if (input instanceof RegExp) {
    return true;
  }

  if (input && typeof input === 'object' && input.constructor.name === 'RE2') {
    return true;
  }

  return false;
}
