'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REWIND_ACTION = exports.META_TIMESTAMP = exports.META_SOURCE = exports.isGossipType = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _dispatcher = require('./dispatcher');

Object.defineProperty(exports, 'isGossipType', {
  enumerable: true,
  get: function get() {
    return _dispatcher.isGossipType;
  }
});

var _constants = require('./constants');

Object.defineProperty(exports, 'META_SOURCE', {
  enumerable: true,
  get: function get() {
    return _constants.META_SOURCE;
  }
});
Object.defineProperty(exports, 'META_TIMESTAMP', {
  enumerable: true,
  get: function get() {
    return _constants.META_TIMESTAMP;
  }
});
Object.defineProperty(exports, 'REWIND_ACTION', {
  enumerable: true,
  get: function get() {
    return _constants.REWIND_ACTION;
  }
});
exports.default = scuttlebutt;

var _dispatcher2 = _interopRequireDefault(_dispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Applies default options.
var defaultOptions = {
  uri: 'http://localhost:3000',
  primus: (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && window.Primus
};

// Store enhancer
// Wraps createStore to inject our history reducer, wraps dispatch to send and
// receive actions from peers, and FIXME: getState to apparently break everything
//
function scuttlebutt(options) {
  options = _extends({}, defaultOptions, options);

  return function (createStore) {
    // is it more efficient to store previous states, or replay a bunch of
    // previous actions? (until we have COMMIT checkpointing, the former)
    var gossip = connectGossip(new _dispatcher2.default(), options.uri, options.primus);

    return function (reducer, preloadedState, enhancer) {
      var store = createStore(gossip.wrapReducer(reducer), [[,, preloadedState]], // preloaded state is the earliest snapshot
      enhancer);

      return _extends({}, store, {
        dispatch: gossip.wrapDispatch(store.dispatch),
        getState: gossip.wrapGetState(store.getState)
      });
    };
  };
}

// initialise network io
function connectGossip(scuttlebutt, uri) {
  var io = Primus.connect(uri);

  console.log('[io] connecting...');

  connectStreams(io, scuttlebutt.createStream());

  return scuttlebutt;
}

// the internet is a series of tubes
function connectStreams(io, gossip) {
  // would love to do this. it doesn't work:
  // spark.pipe(docStream).pipe(spark)
  var DEBUG_DELAY = void 0;
  if (/^#\d+/.test(window.location.hash)) {
    DEBUG_DELAY = parseInt(window.location.hash.substr(1));
    console.debug('delayed connection active', DEBUG_DELAY);
  }

  io.on('data', function message(data) {
    // console.log('[io] <-', data)
    if (DEBUG_DELAY) {
      return setTimeout(function () {
        return gossip.write(data);
      }, DEBUG_DELAY);
    }
    gossip.write(data);
  });

  gossip.on('data', function (data) {
    // console.log('[io] ->', data)
    if (DEBUG_DELAY) {
      return setTimeout(function () {
        return io.write(data);
      }, DEBUG_DELAY);
    }
    io.write(data);
  });

  // network events

  io.on('open', function () {
    console.log('[io] connection open');
  });

  io.on('error', function (error) {
    console.log('[io] error', error);
  });

  // store stream events

  gossip.on('error', function (error) {
    console.warn('[gossip] error', error);
  });

  // handshake header recieved from a new peer. includes their id and clock info
  gossip.on('header', function (header) {
    var id = header.id;
    var clock = header.clock;

    console.log('[gossip] header', id);
  });
}