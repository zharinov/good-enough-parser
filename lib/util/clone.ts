export function clone<T = unknown>(value: T): T {
  const cloned = structuredClone(value);

  if (value instanceof Object) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const proto = Object.getPrototypeOf(value);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.setPrototypeOf(cloned, proto);
  }

  return cloned;
}
