var defaults = require('./defaults.js');

// Public API
module.exports =
{
  on: addListener,
  addListener: addListener,

  addReaction: addReaction,

  emit: emit
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
    event.forEach(function(e)
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
          this.on(i, handler);
        }
        return;
      }

      // regular flow
      this.on(e, handler);
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
    Object.keys(handler).forEach(function(state)
    {
      this.addReaction(event, state, handler[state]);
    }.bind(this));
    return;
  }

  // generic (catch-all) event handler
  this.addReaction(event, defaults.STATE.CATCH, handler);
};

/**
 * [function description]
 * @param   {[type]} token [description]
 * @param   {[type]} state [description]
 * @param   {[type]} handler [description]
 */
function addReaction(token, state, handler)
{
  // special events
  if (['error'].indexOf(token) != -1)
  {
    this.reactions[token] = handler;
  }

  // catch all event
  if (token === defaults.EVENT.CATCHALL)
  {
    if (state === defaults.STATE.CATCH)
    {
      if (this.reactions.catchAll.catchAll)
      {
        this.error('Unable to add reaction for [CATCH ALL] token with [CATCH ALL] state. Already exists.');
        return;
      }

      this.reactions.catchAll.catchAll = handler;
      return;
    }

    if (!('states' in this.reactions.catchAll))
    {
      this.reactions.catchAll.states = {};
    }

    if (state in this.reactions.catchAll.states)
    {
      this.error('Unable to add reaction for [CATCH ALL] token with [' + state + '] state. Already exists.');
      return;
    }

    this.reactions.catchAll.states[state] = handler;
    return;
  }

  if (!(token in this.reactions.tokens))
  {
    this.reactions.tokens[token] = {};
  }

  if (state === defaults.STATE.CATCH)
  {
    if (this.reactions.tokens[token].catchAll)
    {
      this.error('Unable to add reaction for [' + token + '] token with [CATCH ALL] state. Already exists.');
      return;
    }

    this.reactions.tokens[token].catchAll = handler;
    return;
  }

  if (!('states' in this.reactions.tokens[token]))
  {
    this.reactions.tokens[token].states = {};
  }

  if (state in this.reactions.tokens[token].states)
  {
    this.error('Unable to add reaction for [' + token + '] token with [' + state + '] state. Already exists.');
    return;
  }

  this.reactions.tokens[token].states[state] = handler;
};

/**
 * [function description]
 *
 * @param {string|number} event - trigger reaction handler for the current state
 * @param {...mixed} [args] - extra arguments to pass to the event handler
 * @returns {boolean} – `true` if token/event-state handler exists and `false` otherwise
 */
function emit(event)
{
  var newState, args = Array.prototype.slice.call(arguments, 1);

  // check for matching event handlers
  if (event in this.reactions)
  {
    this.reactions[event].apply(this, args);
    return true;
  }

  // check for tokens
  if (event in this.reactions.tokens)
  {
    if (this.reactions.tokens[event].states && (this.state in this.reactions.tokens[event].states))
    {
      newState = this.reactions.tokens[event].states[this.state].apply(this, args);
    }
    else if (this.reactions.tokens[event].catchAll)
    {
      newState = this.reactions.tokens[event].catchAll.apply(this, args);
    }
    // didn't match anything
    else
    {
      return false;
    }

    // if returned something, use it as new state value
    if (typeof newState != 'undefined')
    {
      this.state = newState;
    }

    return true;
  }

  // check for catch all handlers
  if (this.reactions.catchAll.states && (this.state in this.reactions.catchAll.states))
  {
    newState = this.reactions.catchAll.states[this.state].apply(this, args);

    // if returned something, use it as new state value
    if (typeof newState != 'undefined')
    {
      this.state = newState;
    }

    return true;
  }
  else if (this.reactions.catchAll.catchAll)
  {
    this.reactions.catchAll.catchAll.apply(this, args);
    return true;
  }

  // nothing left
  return false;
};
