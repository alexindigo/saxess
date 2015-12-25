var Saxess = require('../');

module.exports = function()
{
  var ss = new Saxess({state: 'out'});

  ss.on('.', {

    dot  : Saxess.parseError(),
    out  : Saxess.collectToken().skipChar().updateState('dot'),
    close: Saxess.collectToken().skipChar().updateState('out')
  });

  // closing bracket per state handler
  // with state update
  ss.on('[', {

    inside: Saxess.updateState('open'),
    dot   : Saxess.skipChar().updateState('inside'),
    open  : Saxess.skipChar().updateState('inside'),
    out   : Saxess.collectToken().skipChar().updateState('inside')
  });

  // closing bracket per state handler
  // with state update
  ss.on(']', {

    out   : Saxess.parseError(),
    dot   : Saxess.parseError(),
    open  : Saxess.parseError(),
    close : Saxess.updateState('inside'),
    inside: Saxess.skipChar().updateState('close')
  });

  // any char per state handler
  ss.on(Saxess.EVENT.CATCHALL, {

    dot   : Saxess.updateState('out'),
    close : Saxess.collectToken().updateState('out')
  });

  return ss;
};
