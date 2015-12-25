var EventEmitter = require('eventemitter3')
  , partial      = require('lodash.partial')
  , inherits     = require('inherits')
  , chains       = require('./lib/chains.js')
  , helpers      = require('./lib/helpers.js')
  ;

// Public API
module.exports = Saxess;

module.exports.parseError   = helpers.parseError;
module.exports.collectToken = helpers.collectToken;
module.exports.updateState  = helpers.updateState;
module.exports.skipChar     = helpers.skipChar;

// make helper methods chainable
chains(Saxess);

// defaults
module.exports.STATE =
{
  START: '_START_',
  ERROR: '_ERROR_',
  FINAL: '_FINAL_'
};

module.exports.EVENT =
{
  CATCHALL: '_CATCHALL_'
};

// mix in EE methods
inherits(Saxess, EventEmitter);

/**
 * Creates new instances,
 * allows continuation by passing state and data
 * from another instances
 *
 * @param {[type]} options [description]
 */
function Saxess(options)
{
  options = options || {};

  this.state       = options.state || Saxess.STATE.START;
  this.finalState  = options.finalState || Saxess.STATE.FINAL;

  this.acummulator = options.acummulator || '';
  this.charSkipped = options.charSkipped || false;

  this.tokens      = options.tokens || [];
}

/**
 * [function description]
 * @param   {[type]} string [description]
 */
Saxess.prototype.parse = function(string)
{
  this.code = string.charCodeAt(0);
  this.char = String.fromCharCode(this.code);

  // error
  if (this.state == Saxess.STATE.ERROR)
  {
    return;
  }

  // nothing left to parse
  if (isNaN(this.code))
  {
    // flush leftover chars
    this.collectToken();
    this.state = this.finalState;
    this.emit('end', this.tokens);
    return;
  }

  // continue
  if (!this.emit(this.code))
  {
    this.emit(Saxess.EVENT.CATCHALL, this.char);
  }

  this.accumulate(this.char);

  this.parse(string.substr(1, string.length));
};

/**
 * [function description]
 * @returns {[type]} [description]
 */
Saxess.prototype.collectToken = function()
{
  if (this.acummulator.length)
  {
    this.tokens.push(this.acummulator);
    this.acummulator = '';
  }

  return this.tokens[this.tokens.length - 1];
};

/**
 * [function description]
 * @param   {[type]} event [description]
 * @param   {[type]} handler [description]
 * @param   {[type]} context [description]
 * @returns {[type]} [description]
 */
Saxess.prototype.addListener = Saxess.prototype.on = function(event, handler, context)
{
  // support event sets
  if (Array.isArray(event))
  {
    event.map(function(e)
    {
      var a, b, i;
      // check for ranges
      if (Array.isArray(e))
      {
        // get range codes
        a = typeof e[0] == 'number' ? e[0] : e[0].charCodeAt(0);
        b = typeof e[1] == 'number' ? e[1] : e[1].charCodeAt(0);

        // get each and every one of them
        for (i=a; i<=b; i++)
        {
          this.on(i, handler, context);
        }
        return;
      }

      // regular flow
      this.on(e, handler, context);
    }.bind(this));
    return;
  }

  // allow char events,
  // consider multi char as special events
  if (typeof event == 'string' && event.length == 1)
  {
    event = event.charCodeAt(0);
  }

  // allow per state event handlers
  if (typeof handler == 'object')
  {
    handler = partial(this.emitForState, handler);
  }

  return Saxess.super_.prototype.on.call(this, event, handler, context);
};

/**
 * [function description]
 *
 * @param   {object} handlers [description]
 */
Saxess.prototype.emitForState = function(handlers)
{
  var state, args = Array.prototype.slice.call(arguments, 1);

  if (typeof handlers[this.state] == 'function')
  {
    state = handlers[this.state].apply(this, args);

    // if returned something, use it as new state value
    if (typeof state != 'undefined')
    {
      this.state = state;
    }
  }
};

/**
 * [function description]
 * @param   {[type]} char [description]
 */
Saxess.prototype.accumulate = function(char)
{
  if (!this.charSkipped)
  {
    this.acummulator += char;
  }
  this.charSkipped = false;
};

/**
 * [function description]
 */
Saxess.prototype.skipChar = function()
{
  this.charSkipped = true;
};

/**
 * [parserError description]
 * @param   {[type]} message [description]
 * @param   {[type]} state [description]
 */
Saxess.prototype.parseError = function(message, state)
{
  message    = message || 'Unable to parse ' + this.char + ' (#' + this.code + ') within <' + this.state + '> state.';
  this.state = state || Saxess.STATE.ERROR;

  if (!this.emit('error', message))
  {
    throw new Error(message);
  }
};
