var OK     = false;
var assert = require('assert');
var parser = require('./pointer-parser.js')();

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.vroom[[]here.there[]]-]]+[[]]*[[/]]]';
var expected = ['abc', 'def', 'ghi.jkl', 'mno', 'pqr', 'st[uv]wx', 'yz', '123', '456', ']boom.vroom[', 'here', 'there', ']-]+[]*[/]'];

// error handling
parser.on('error', function(message)
{
  console.log('FAILED:', message);
  console.trace();
  process.exit(1);
});

// last event with one-for-all handler
parser.on('end', function(tokens)
{
  OK = true;
  console.log('+ OK, POINTER TOKENS:', JSON.stringify(tokens));
  assert.deepEqual(tokens, expected);
});

// start parsing
console.log('- TEST:', str);
parser.parse(str);

// return status
module.exports = OK;
