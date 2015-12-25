var OK     = false;
var assert = require('assert');
var parser = require('./pointer-parser.js')();

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.v]room[[]here.there[]]-]]+[[]]*[[/]]]';

// last event with one-for-all handler
parser.on('end', function(tokens)
{
  console.log('! DONE:', JSON.stringify(tokens));
  console.log('But should not get here');
  console.trace();
  assert.fail();
});

// start parsing
console.log('- TEST:', str);
assert.throws(function()
{
  parser.parse(str);
},
function(err)
{
  assert.ok(err instanceof Error);
  assert.equal(err.message, 'Unable to parse ] (#93) within <open> state.');
  console.log('+ THREW expectedly:', err.message);
  OK = true;
  return true;
});

// return status
module.exports = OK;
