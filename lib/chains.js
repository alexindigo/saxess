var partial = require('lodash.partial')
  , extend  = require('xtend/mutable')
  ;

// Public API
module.exports           = chains;
module.exports.transform = transform;

// defaults
chains.CHAINED_METHOD = '_chained_method_';

/**
 * Augments own function properties of the provided object
 * to make them chain-able
 *
 * @param   {object} host – chained functions host object
 * @param   {object|array} options - either list of whitelisted methods,
 *                           or object with `whitelist` or `blacklist`
 * @returns {object} augmented host object
 */
function chains(host, options)
{
  options = options || {};

  if (Array.isArray(options))
  {
    options = {whitelist: options};
  }

  Object.keys(host).forEach(function(method)
  {
    if (host.hasOwnProperty(method) && typeof host[method] == 'function')
    {
      // skip blacklisted
      if (options.blacklist && options.blacklist.indexOf(method) != -1)
      {
        return;
      }

      // if whitelist enabled only use
      if (options.whitelist)
      {
        if (options.whitelist.indexOf(method) != -1)
        {
          host[method] = transform(host, host[method]);
        }
      }
      else
      {
        host[method] = transform(host, host[method]);
      }
    }
  });

  return host;
}

/**
 * [transform description]
 *
 * @param   {object} [host] [description]
 * @param   {function} method [description]
 * @returns {function} [description]
 */
function transform(host, method)
{
  var args = Array.prototype.slice.call(arguments, 2);

  // `host` is optional
  if (typeof host == 'function' && typeof method != 'function')
  {
    method = host;
    host   = {};
    // adjust args
    args = Array.prototype.slice.call(arguments, 1);
  }

  return partial.apply(null, [chainable, host, method].concat(args));
}

/**
 * [chainable description]
 *
 * @param   {object} host [description]
 * @param   {function} method [description]
 * @returns {function} [description]
 */
function chainable(host, method)
{
  var args     = Array.prototype.slice.call(arguments, 2)
    , resolver = partial.apply(null, [resolve, this[chains.CHAINED_METHOD], method].concat(args))
    , chained  = extend(resolver, host)
    ;

  // add itself as hidden chained action
  Object.defineProperty(chained, chains.CHAINED_METHOD, {
    value: resolver
  });

  return chained;
}

/**
 * [resolve description]
 *
 * @param   {[type]} chained [description]
 * @param   {Function} method [description]
 * @returns {[type]} [description]
 */
function resolve(chained, method)
{
  var args = Array.prototype.slice.call(arguments, 2);

  // execute queue
  if (typeof chained == 'function')
  {
    chained.call(this);
  }

  return method.apply(this, args);
}
