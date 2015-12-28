var OK     = false;
var assert = require('assert');
var parser = require('./pointer-parser.js')();

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.v]room[[]here.there[]]-]]+[[]]*[[/]]]';

// error handling
parser.on('error', function(message)
{
  OK = true;
  console.log('+ FAILED expectedly:', message);
  assert.equal(message, 'Unable to parse ] (#93) within <open> state.');
});

// last event with one-for-all handler
parser.on('end', function(tokens)
{
  console.log('! NOT OK, POINTER TOKENS:', JSON.stringify(tokens));
  console.log('Failed, expected to trigger error event at malformed pointer and cancel parsing.');
  console.trace();
  assert.fail();
});

// start parsing
console.log('- TEST:', str);
parser.parse(str);

// return status
module.exports = OK;
