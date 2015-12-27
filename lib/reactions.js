var defaults = require('./defaults.js');

// Public API
module.exports =
{
  addListener: addListener,
  addReaction: addReaction,
  trigger    : trigger
};

/**
 * Adds event to the list of reactions
 *
 * @param   {[type]} event [description]
 * @param   {[type]} handler [description]
 */
function addListener(event, handler)
{
  // support event sets
  if (Array.isArray(event))
  {
    event.forEach(processEventItem.bind(this, handler));
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
    Object.keys(handler).forEach(function(state)
    {
      this.addReaction(event, state, handler[state]);
    }.bind(this));
    return;
  }

  // generic (catch-all) event handler
  this.addReaction(event, defaults.STATE.CATCHALL, handler);
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
    this.error('Unable to add reaction for [' + token + '] token with [' + state + '] state. Already exists.');
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
 * @param {string|number} event - trigger reaction handler for the current state
 * @param {...mixed} [args] - extra arguments to pass to the event handler
 * @returns {boolean} – `true` if token/event-state handler exists and `false` otherwise
 */
function trigger(event)
{
  var handler
    , foundHandler = false
    , args         = Array.prototype.slice.call(arguments, 1)
    ;

  // check for matching event handlers
  if (event in this.reactions)
  {
    handler = this.reactions[event];
  }
  // check for tokens
  else if (event in this.reactions.tokens)
  {
    handler = getHandler.call(this, this.reactions.tokens[event]);
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
 * Processes range values
 * creates list of all the elements in the range
 * and calls `addListener` for each of them
 *
 * @param   {array} range - two elements array with `from` and `to` values
 * @param   {function} handler - event handler to pass to `addListener`
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
 * Executes provided reaction handler
 * within parser context and with passed arguments
 *
 * @param   {function} reaction - reaction handler
 * @param   {...mixed} [args] list of arguments to pass
 * @returns {void}
 */
function execute(reaction, args)
{
  // get all args
  var args     = Array.prototype.slice.call(arguments, 1)
    , newState = reaction.apply(this, args)
    ;

  // if returned something, use it as new state value
  if (typeof newState != 'undefined')
  {
    this.state = newState;
  }
}
