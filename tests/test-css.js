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
parser.on('\n', Saxess.skipChar());
parser.on(' ', Saxess.skipChar());

parser.on('.', {
  _START_  : Saxess.collectToken().updateState('CLASS')
});
parser.on('#', {
  _START_  : Saxess.collectToken().updateState('ID'),
  VALUE    : Saxess.updateState('COLOR')
});

parser.on('{', {
  ID   : Saxess.collectToken().updateState('RULE'),
  CLASS: Saxess.collectToken().updateState('RULE'),
  TAG  : Saxess.collectToken().updateState('RULE')
});

// TODO: Make parseError default when no state handler found
parser.on('}', {
  _START_  : Saxess.parseError(),
  ID       : Saxess.parseError(),
  CLASS    : Saxess.parseError(),
  KEY      : Saxess.parseError(),
  VALUE    : Saxess.parseError(),

  RULE     : Saxess.updateState('_START_')
});

parser.on(':', {
  _START_  : Saxess.parseError(),
  RULE     : Saxess.parseError(),

  KEY      : Saxess.collectToken().skipChar().updateState('VALUE')
});

parser.on(';', {
  _START_  : Saxess.parseError(),
  RULE     : Saxess.parseError(),

  VALUE    : Saxess.collectToken().skipChar().updateState('RULE'),
  COLOR    : Saxess.collectToken().skipChar().updateState('RULE')
});

parser.on(Saxess.EVENT.CATCHALL, {
  _START_  : Saxess.collectToken().updateState('TAG'),
  RULE     : Saxess.collectToken().updateState('KEY'),
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
  console.log('+ DONE:', JSON.stringify(tokens));
  assert.deepEqual(tokens, expected);
});

// just do it
console.log('- TEST:', input.replace(/\n/g, ' '));
parser.parse(input);

// report
module.exports = OK;
