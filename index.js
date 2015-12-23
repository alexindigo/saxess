var EventEmitter = require('eventemitter3')
  , partial      = require('lodash.partial')
  , inherits     = require('inherits')
  , extend       = require('xtend/mutable')
  ;

// Public API
module.exports = Saxess;

module.exports.parseError = parseError;

module.exports.collectToken = partial(chainsaw, Saxess, collectToken);
module.exports.updateState  = partial(chainsaw, Saxess, updateState);
module.exports.skipChar     = partial(chainsaw, Saxess, skipChar);

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

  if (!isNaN(this.code))
  {
    if (!this.emit(this.code))
    {
      this.emit(Saxess.EVENT.CATCHALL, this.char);
    }

    this.accumulate(this.char);

    this.parse(string.substr(1, string.length));
  }
  else
  {
    // flush leftover chars
    this.collectToken();
    this.state = this.finalState;
    this.emit('end', this.tokens);
  }
};

/**
 * [function description]
 * @returns {[type]} [description]
 */
Saxess.prototype.collectToken = function()
{
  this.tokens.push(this.acummulator);

  this.acummulator = '';

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

// -- subroutines

/**
 * [parserError description]
 * @param   {[type]} message [description]
 * @param   {[type]} state [description]
 * @returns {function} parse error function
 */
function parseError(message, state)
{
  return function()
  {
    message    = message || 'Unable to parse ' + this.char + ' (#' + this.code + ') within <' + this.state + '> state.';
    this.state = state || Saxess.STATE.ERROR;

    if (!this.emit('error', message))
    {
      throw new Error(message);
    }
  };
}

/**
 * [updateState description]
 * @param   {[type]} state [description]
 * @returns {[type]} [description]
 */
function updateState(state)
{
  return state;
}

/**
 * [skipChar description]
 * @param   {[type]} actions [description]
 */
function skipChar()
{
  this.skipChar();
}

/**
 * [collectToken description]
 */
function collectToken()
{
  this.collectToken();
}

/**
 * [chainsaw description]
 * @param   {[type]} collection [description]
 * @param   {[type]} action [description]
 * @returns {[type]} [description]
 */
function chainsaw(collection, action)
{
  var args        = Array.prototype.slice.call(arguments, 2)
    , localAction = partial.apply(null, [chainsawer, this._chained_actions_, action].concat(args))
    , chainable   = extend(localAction, collection)
    ;

  // create queue
  chainable._chained_actions_ = chainable._chained_actions_ || [];
  chainable._chained_actions_.push(localAction);

  return chainable;
}

/**
 * [chainsawer description]
 * @param   {[type]} actions [description]
 * @param   {Function} callback [description]
 * @returns {[type]} [description]
 */
function chainsawer(actions, callback)
{
  var args = Array.prototype.slice.call(arguments, 2);

  // execute queue
  (actions || []).forEach(function(action)
  {
    action.call(this);
  }.bind(this));

  return callback.apply(this, args);
}
