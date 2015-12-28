var OK       = false
  , assert   = require('assert')
  , fs       = require('fs')
  , path     = require('path')
  , Saxess   = require('../')
  , input    = fs.readFileSync(path.join(__dirname, 'css-input.css'), {encoding: 'utf8'})
  , expected = require(path.join(__dirname, 'css-expected.js'))
  ;

var parser = new Saxess();

// clean up
parser.on(['\n', ' '], {
  VALUE     : Saxess.collectToken().skipChar(),
  _CATCHALL_: Saxess.skipChar()
});

parser.on('.', {
  _START_  : Saxess.collectToken().updateState('CLASS')
});
parser.on('#', {
  _START_  : Saxess.collectToken().updateState('ID'),
  VALUE    : Saxess.updateState('COLOR')
});

parser.on('{', {
  ID     : Saxess.collectToken().updateState('RULE'),
  CLASS  : Saxess.collectToken().updateState('RULE'),
  TAG    : Saxess.collectToken().updateState('RULE'),
  PSEUDO : Saxess.collectToken().updateState('RULE'),
  ATTR   : Saxess.collectToken().updateState('RULE')
});

parser.on('}', {
  _START_  : Saxess.parseError(),
  ID       : Saxess.parseError(),
  CLASS    : Saxess.parseError(),
  KEY      : Saxess.parseError(),
  VALUE    : Saxess.parseError(),

  RULE     : Saxess.collectToken().updateState('_START_')
});

parser.on(':', {
  RULE     : Saxess.parseError(),

  _START_  : Saxess.collectToken().updateState('PSEUDO'),
  CLASS    : Saxess.collectToken().updateState('PSEUDO'),
  ID       : Saxess.collectToken().updateState('PSEUDO'),
  TAG      : Saxess.collectToken().updateState('PSEUDO'),

  KEY      : Saxess.collectToken().skipChar().updateState('VALUE')
});

parser.on('[', {
  RULE     : Saxess.parseError(),

  _START_  : Saxess.collectToken().updateState('ATTR'),
  CLASS    : Saxess.collectToken().updateState('ATTR'),
  ID       : Saxess.collectToken().updateState('ATTR'),
  TAG      : Saxess.collectToken().updateState('ATTR'),

  KEY      : Saxess.collectToken().skipChar().updateState('VALUE')
});

parser.on(';', {
  _START_  : Saxess.parseError(),
  RULE     : Saxess.parseError(),

  VALUE    : Saxess.collectToken().updateState('RULE'),
  COLOR    : Saxess.collectToken().updateState('RULE')
});

parser.on([['0', '9'], [65, 90], ['a', 'z']], {
  _START_  : Saxess.collectToken().updateState('TAG'),
  RULE     : Saxess.collectToken().updateState('KEY')
});

// match word, and get back to the `TAG` state
parser.on([['data-role']], {
  ATTR: Saxess.collectToken().updateState('ATTR')
});

// error handling
parser.on('error', function(message)
{
  console.log('FAILED:', message, this.tokens);
  console.trace();
  process.exit(1);
});

// last event with one-for-all handler
parser.on('end', function(tokens)
{
  OK = true;
  console.log('+ OK, CSS TOKENS:', JSON.stringify(tokens));
  assert.deepEqual(tokens, expected);
});

// just do it
console.log('- TEST:', input.replace(/\n/g, ' '));
parser.parse(input);

// report
module.exports = OK;
