// ├── csv-parse@1.1.7 
// └─┬ csv-stringify@1.0.4 
//   └── lodash.get@4.4.2	// Replace with lodash
module.exports = {
  parse: require('./csv-parse/sync'),
  stringify: require('./csv-stringify/sync'),
}