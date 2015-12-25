// Public API
module.exports =
{
  parseError  : parseError,
  updateState : updateState,
  skipChar    : skipChar,
  collectToken: collectToken
};

/**
 * [parserError description]
 * @param   {[type]} message [description]
 * @param   {[type]} state [description]
 */
function parseError(message, state)
{
  this.parseError(message, state);
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
