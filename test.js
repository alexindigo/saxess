var assert = require('assert');
var Saxess = require('./');

var str = 'abc.def[ghi.jkl]mno.pqr[st[[uv]]wx].yz.[123].456.[]]boom.vroom[[]here.there[]]-]]+[[]]*[[/]]]';
var expected = ['abc', 'def', 'ghi.jkl', 'mno', 'pqr', 'st[uv]wx', 'yz', '123', '456', ']boom.vroom[', 'here', 'there', ']-]+[]*[/]'];

var ss = new Saxess({state: 'out'});

ss.on('.', {

  dot  : Saxess.parseError(),
  out  : Saxess.collectToken().skipChar().updateState('dot'),
  close: Saxess.collectToken().skipChar().updateState('out')
});

// closing bracket per state handler
// with state update
ss.on('[', {

  inside: Saxess.updateState('open'),
  dot   : Saxess.skipChar().updateState('inside'),
  open  : Saxess.skipChar().updateState('inside'),
  out   : Saxess.collectToken().skipChar().updateState('inside')
});

// closing bracket per state handler
// with state update
ss.on(']', {

  out   : Saxess.parseError(),
  dot   : Saxess.parseError(),
  open  : Saxess.parseError(),
  close : Saxess.updateState('inside'),
  inside: Saxess.skipChar().updateState('close')
});

// any char per state handler
ss.on(Saxess.EVENT.CATCHALL, {

  dot   : Saxess.updateState('out'),
  close : Saxess.collectToken().updateState('out')
});

// last event with one-for-all handler
ss.on('end', function(tokens)
{
  console.log('\n --\nDONE:', tokens, this.state);

  assert.deepEqual(tokens, expected);
});

ss.on('error', function(message)
{
  console.log('FAILED:', message);
  console.trace();
  process.exit(1);
});

console.log('\n---\nSTART:', str, '\n');

ss.parse(str);
