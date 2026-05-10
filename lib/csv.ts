/* eslint-disable @typescript-eslint/no-require-imports */
const CSV = {
  parse: require('./csv-parse/sync') as (input: string, opts?: unknown) => unknown[],
  stringify: require('./csv-stringify/sync') as (input: unknown[], opts?: unknown) => string,
}
/* eslint-enable @typescript-eslint/no-require-imports */

export default CSV
