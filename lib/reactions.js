var partial  = require('lodash.partial')
  , helpers  = require('./helpers.js')
  , defaults = require('./defaults.js')
  ;

// Public API
module.exports =
{
  addListener: addListener,
  addReaction: addReaction,
  trigger    : trigger
};

/**
 * Adds event to the list of reactions.
 * Tokens represented by single chars or numbers,
 * events represented by strings. Also supports
 * arrays as sets of tokens or array of two-elements array
 * for ranges of tokens.
 *
 * @param   {mixed} token - token or event identifier,
 * @param   {function} handler - event/token listener handler
 */
function addListener(token, handler)
{
  // support event sets
  if (Array.isArray(token))
  {
    token.forEach(processEventItem.bind(this, handler));
    return;
  }

  // allow char events,
  // consider multi char as special events
  if (typeof token == 'string' && token.length == 1)
  {
    token = token.charCodeAt(0);
  }

  // allow per state event handlers
  if (typeof handler == 'object')
  {
    Object.keys(handler).forEach(function(state)
    {
      this.addReaction(token, state, handler[state]);
    }.bind(this));
    return;
  }

  // generic (catch-all) event handler
  this.addReaction(token, defaults.STATE.CATCHALL, handler);
}

/**
 * Adds reaction for token/state pair,
 * unless one doesn't exist already.
 *
 * @param   {string|number} token - token or event to listen to
 * @param   {string} state - corresponding state for to be triggered in
 * @param   {function} handler - handler to be invoked
 * @returns {boolean} `true` is listener was added and `false` otherwise
 */
function addReaction(token, state, handler)
{
  var stored = false;

  // special events
  if (['error'].indexOf(token) != -1)
  {
    this.reactions[token] = handler;
    stored = true;
  }
  // catch all event
  else if (token === defaults.EVENT.CATCHALL)
  {
    stored = storeReaction(this.reactions.catchAll, state, handler);
  }
  // regular token listeners
  else
  {
    if (!(token in this.reactions.tokens))
    {
      this.reactions.tokens[token] = {};
    }

    stored = storeReaction(this.reactions.tokens[token], state, handler);
  }

  if (!stored)
  {
    this.error('Unable to add reaction for [' + token + '|' + JSON.stringify(String.fromCharCode(token)) + '] token with [' + state + '] state. Already exists.');
  }

  return stored;
}

/**
 * stores provided handler within storage object per state
 *
 * @param   {[type]} storage [description]
 * @param   {[type]} state [description]
 * @param   {[type]} handler [description]
 * @returns {[type]} [description]
 */
function storeReaction(storage, state, handler)
{
  if (state === defaults.STATE.CATCHALL)
  {
    if (storage.catchAll)
    {
      return false;
    }

    storage.catchAll = handler;
    return true;
  }

  if (!('states' in storage))
  {
    storage.states = {};
  }

  if (state in storage.states)
  {
    return false;
  }

  storage.states[state] = handler;
  return true;
}

/**
 * Triggers handler for token/state pair
 *
 * @param {string|number} token - trigger reaction handler for the current state/token (or event)
 * @param {...mixed} [args] - extra arguments to pass to the event handler
 * @returns {boolean} – `true` if token/event-state handler exists and `false` otherwise
 */
function trigger(token)
{
  var handler
    , foundHandler = false
    , args         = Array.prototype.slice.call(arguments, 1)
    ;

  // check for matching event handlers
  if (token in this.reactions)
  {
    handler = this.reactions[token];
  }
  // check for tokens
  else if (token in this.reactions.tokens)
  {
    handler = getHandler.call(this, this.reactions.tokens[token]);
  }
  // check for catch all handlers
  else
  {
    handler = getHandler.call(this, this.reactions.catchAll);
  }

  // nothing left
  if (handler)
  {
    foundHandler = true;
    handler.apply(this, args);
  }

  return foundHandler;
}

/**
 * Decides if proper handler exists for current state
 * within provided storage Object
 *
 * @param   {object} storage - storage to search within
 * @returns {function} discovered `handler` or `undefined`
 */
function getHandler(storage)
{
  var handler;

  if (storage.states && (this.state in storage.states))
  {
    handler = execute.bind(this, storage.states[this.state]);
  }
  else if (storage.catchAll)
  {
    handler = execute.bind(this, storage.catchAll);
  }

  return handler;
}

/**
 * Processes items from event array
 * dissects array elements and passes it
 * back to `addListener` as primitive values
 *
 * @param   {function} handler - event handler
 * @param   {mixed} item - event array item for further examination
 */
function processEventItem(handler, item)
{
  // check for ranges
  if (Array.isArray(item))
  {
    switch(item.length)
    {
      // single element array - word
      case 1:
        processWord.call(this, item[0], handler);
        break;
      // two elements array – range
      case 2:
        processRange.call(this, item, handler);
        break;

      default:
        this.error('Unsupported event type.');
    }
  }
  // regular flow
  else
  {
    addListener.call(this, item, handler);
  }
}

/**
 * Splits word into tokens (chars)
 * and creates states chain to track it
 *
 * @param   {string} word - word to track
 * @param   {function|object} handler - event handler to pass to `addListener`
 */
function processWord(word, handler)
{
  var offset = word.length
    , code   = word.charCodeAt(0)
    , currState
    , nextState
    ;

  // initial state and handler
  currState   = '';

  while (offset > 0)
  {
    offset--;
    nextState = ':word-' + word + '-' + offset + '-' + code;

    if (typeof handler == 'object')
    {
      Object.keys(handler).forEach(function(state)
      {
        // TODO: Clean it up
        trackTokenState.call(this, code, offset, currState, nextState, word, handler[state], state, state);
      }.bind(this));
    }
    else
    {
      // TODO: Clean it up
      trackTokenState.call(this, code, offset, currState, nextState, word, handler, defaults.STATE.CATCHALL, this.startState);
    }

    // prepare for the next round
    currState = nextState;
    code      = word.charCodeAt(word.length - offset);
  }
}

/**
 * Processes range values
 * creates list of all the elements in the range
 * and calls `addListener` for each of them
 *
 * @param   {array} range - two elements array with `from` and `to` values
 * @param   {function|object} handler - event handler to pass to `addListener`
 */
function processRange(range, handler)
{
  var i, from, to;

  // get range codes
  from = typeof range[0] == 'number' ? range[0] : range[0].charCodeAt(0);
  to   = typeof range[1] == 'number' ? range[1] : range[1].charCodeAt(0);

  // get each and every one of them
  for (i=from; i<=to; i++)
  {
    addListener.call(this, i, handler);
  }
}

/**
 * [trackTokenState description]
 * @param   {[type]} code [description]
 * @param   {[type]} offset [description]
 * @param   {[type]} currState [description]
 * @param   {[type]} nextState [description]
 * @param   {[type]} word [description]
 * @param   {[type]} handler [description]
 * @param   {[type]} state [description]
 * @param   {[type]} fallbackState [description]
 */
function trackTokenState(code, offset, currState, nextState, word, handler, state, fallbackState)
{
  // reroute reactions to internal states/handlers
  var reaction = helpers.updateState(state + nextState);

  // add safety next for internal (custom) states only
  if (currState)
  {
    // back to the original state
    addReaction.call(this, defaults.EVENT.CATCHALL, state + currState, helpers.updateState(fallbackState));
  }

  // if everything found ok,
  // catch the next token after last one
  if (offset === 0)
  {
    addReaction.call(this, defaults.EVENT.CATCHALL, state + nextState, partial(roundupTokenWord, word, handler));
  }

  // `currState` is empty for the initial iteration
  addReaction.call(this, code, state + currState, reaction);
}

/**
 * [roundupTokenWord description]
 * @param   {[type]} word [description]
 * @param   {[type]} handler [description]
 * @returns {[type]} [description]
 */
function roundupTokenWord(word, handler)
{
  // get only `handler` bound arguments
  var args = Array.prototype.slice.call(arguments, 2);

  this.collectToken(word);
  // allow this char to play one more time
  // without duplicating in the output
  this.skipChar();
  this.reevaluateChar();
  // try original handler
  return handler.apply(this, args);
}

/**
 * Executes provided reaction handler
 * within parser context and with passed arguments
 *
 * @param   {function} reaction - reaction handler
 * @param   {...mixed} [args] list of arguments to pass
 * @returns {void}
 */
function execute(reaction, args)
{
  var newState;

  // get all args
  args     = Array.prototype.slice.call(arguments, 1);
  // invoke reaction handler
  newState = reaction.apply(this, args);

  // if returned something, use it as new state value
  if (typeof newState != 'undefined')
  {
    this.state = newState;
  }
}
