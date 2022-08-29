export function escape(input: string): string {
  return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
