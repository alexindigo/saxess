var chains = require('./chains.js');

// Public API
module.exports =
{
  parseError    : parseError,
  updateState   : updateState,
  skipChar      : skipChar,
  collectToken  : collectToken,
  reevaluateChar: reevaluateChar
};

// make helper methods chainable
chains(module.exports);

/**
 * [parserError description]
 */
function parseError()
{
  this.parseError.apply(this, arguments);
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
  this.skipChar.apply(this, arguments);
}

/**
 * [collectToken description]
 */
function collectToken()
{
  this.collectToken.apply(this, arguments);
}

/**
 * [reevaluateChar description]
 */
function reevaluateChar()
{
  this.reevaluateChar.apply(this, arguments);
}
