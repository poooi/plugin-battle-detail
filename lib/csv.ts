// eslint-disable-next-line @typescript-eslint/no-require-imports
const CSV = {
  parse: require('./csv-parse/sync') as (input: string, opts?: any) => any[],
  stringify: require('./csv-stringify/sync') as (input: any[], opts?: any) => string,
}

export default CSV
