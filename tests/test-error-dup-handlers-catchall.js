var OK     = false;
var assert = require('assert');
var parser = require('./pointer-parser.js')();

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.v]room[[]here.there[]]-]]+[[]]*[[/]]]';

// error handling
parser.on('error', function(message)
{
  OK = true;
  console.log('+ FAILED expectedly:', message);
  assert.equal(message, 'Unable to add reaction for [98] token with [_CATCHALL_] state. Already exists.');
});

// duplicated events
parser.on('b', function(){/* handler for token `b` */});
parser.on([['a', 'c']], function(){/* handler for tokens `a` through `c` */});

// start parsing
console.log('- TEST:', str);
parser.parse(str);

// return status
module.exports = OK;
