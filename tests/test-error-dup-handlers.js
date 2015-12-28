var OK     = false;
var assert = require('assert');
var parser = require('./pointer-parser.js')();

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.v]room[[]here.there[]]-]]+[[]]*[[/]]]';

// error handling
parser.on('error', function(message)
{
  OK = true;
  console.log('+ FAILED expectedly:', message);
  assert.equal(message, 'Unable to add reaction for [120|"x"] token with [state] state. Already exists.');
});

// duplicated events
parser.on('x', {state: 'handler for token `x` within `state` state'});
parser.on([['x', 'z']], {state: 'handler for tokens `x` through `z` within `state` state'});

// start parsing
console.log('- TEST:', str);
parser.parse(str);

// return status
module.exports = OK;
