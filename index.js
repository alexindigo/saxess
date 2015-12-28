var helpers   = require('./lib/helpers.js')
  , defaults  = require('./lib/defaults.js')
  , reactions = require('./lib/reactions.js')
  ;

// Public API
module.exports = Saxess;

module.exports.parseError     = helpers.parseError;
module.exports.collectToken   = helpers.collectToken;
module.exports.updateState    = helpers.updateState;
module.exports.skipChar       = helpers.skipChar;
module.exports.reevaluateChar = helpers.reevaluateChar;

// export defaults
module.exports.STATE = defaults.STATE;
module.exports.EVENT = defaults.EVENT;

/**
 * Creates new instances,
 * allows continuation by passing state and data
 * from another instances
 *
 * @param {object} options [description]
 */
function Saxess(options)
{
  options = options || {};

  this.state       = options.state || defaults.STATE.START;
  this.startState  = this.state;
  this.finalState  = options.finalState || defaults.STATE.FINAL;

  this.acummulator = options.acummulator || '';
  this.charSkipped = options.charSkipped || false;
  this.charReevaluated = options.charReevaluated || false;

  // parsed tokens buffer
  this.tokens      = options.tokens || [];

  // reactions storage
  this.reactions   = {tokens: {}, catchAll: {}};
}

// Add events/reactions handling
Saxess.prototype.on          = reactions.addListener;
Saxess.prototype.addListener = reactions.addListener;
Saxess.prototype.addReaction = reactions.addReaction;
Saxess.prototype.trigger     = reactions.trigger;

/**
 * [function description]
 * @param   {[type]} string [description]
 */
Saxess.prototype.parse = function(string)
{
  this.code = string.charCodeAt(0);
  this.char = String.fromCharCode(this.code);

  // error
  if (this.state == defaults.STATE.ERROR)
  {
    return;
  }

  // nothing left to parse
  if (isNaN(this.code))
  {
    // flush leftover chars
    this.collectToken();
    this.state = this.finalState;
    this.trigger('end', this.tokens);
    return;
  }

  // report next char
  this.trigger(this.code);

  // and store it
  this.accumulate(this.char);

  if (this.charReevaluated)
  {
    this.charReevaluated = false;
    // try one more time
    this.parse(string);
  }
  else
  {
    // go to the next one
    this.parse(string.substr(1, string.length));
  }
};

/**
 * [function description]
 * @param   {string} forceToken - token to forcibly separate from accumulator
 * @returns {string} last token in the set
 */
Saxess.prototype.collectToken = function(forceToken)
{
  if (this.acummulator.length)
  {
    // if there is nothing else to `acummulator` than `forceToken`
    // don't bother, otherwise, create two separate tokens
    // only if `acummulator` actually contains `forceToken` as the last part
    if (forceToken
      && this.acummulator.length > forceToken.length
      && this.acummulator.substr(forceToken.length * -1) === forceToken)
    {
      // strip part before `forceToken` and let normal flow take care of the rest
      this.tokens.push(this.acummulator.slice(0, forceToken.length * -1));
      this.acummulator = forceToken;
    }

    this.tokens.push(this.acummulator);
    this.acummulator = '';
  }

  return this.tokens[this.tokens.length - 1];
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

Saxess.prototype.reevaluateChar = function()
{
  this.charReevaluated = true;
};

/**
 * [parserError description]
 * @param   {[type]} message [description]
 * @param   {[type]} state [description]
 */
Saxess.prototype.parseError = function(message, state)
{
  message = message || 'Unable to parse ' + this.char + ' (#' + this.code + ') within <' + this.state + '> state.';
  this.error(message, state);
};

/**
 * Generic error funnel
 *
 * @param   {string} [message] - error message
 * @param   {string} [state] - custom error state
 */
Saxess.prototype.error = function(message, state)
{
  this.state = state || defaults.STATE.ERROR;

  if (!this.trigger('error', message))
  {
    throw new Error(message);
  }
};
