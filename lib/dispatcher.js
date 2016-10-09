'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.isGossipType = isGossipType;

var _scuttlebutt = require('scuttlebutt');

var _scuttlebutt2 = _interopRequireDefault(_scuttlebutt);

var _orderedHistory = require('./orderedHistory');

var orderedHistory = _interopRequireWildcard(_orderedHistory);

var _constants = require('./constants');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// ignore actiontypes beginning with @
// by default just pass through missing types (redux will blow up later)
function isGossipType() {
  var type = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  return type.substr(0, 1) !== '@';
}

// queue a _reduxDispatch call, debounced by animation frame.
// configurable, but requires use of private methods at the moment
// keep a reference to dispatcher because methods will change over time
function getDelayedDispatch(dispatcher) {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
    return false;
  }

  var queue = [];

  function drainQueue() {
    var state = dispatcher._reduxGetState(),
        i = void 0;

    for (i = 0; i < 100 && i <= queue.length - 1; i++) {
      // for-real dispatch the last action, triggering redux's subscribe
      // (and thus UI re-renders). This prioritises crunching data over
      // feedback, but potentially we should dispatch perodically, even
      // with items in the queue
      if (i < queue.length - 1) {
        state = dispatcher._historyReducer(state, queue[i]);
      } else {
        // unsure of delaying the dispatch itself is a net gain.
        // requestAnimationFrame(
        //   ((action) => () => dispatcher._reduxDispatch(action))(queue[i])
        // )

        dispatcher._reduxDispatch(queue[i]);
      }
    }

    // reset the queue
    queue.splice(0, i + 1);

    if (queue.length) requestAnimationFrame(drainQueue);
  }

  return function delayedDispatch(action) {
    queue.push(action);

    // on first action, queue dispatching the action queue
    if (queue.length === 1) {
      requestAnimationFrame(drainQueue);
    }
  };
}

var defaultOptions = {
  delayedDispatch: getDelayedDispatch
};

var Dispatcher = function (_Scuttlebutt) {
  _inherits(Dispatcher, _Scuttlebutt);

  function Dispatcher(options) {
    _classCallCheck(this, Dispatcher);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Dispatcher).call(this));

    _this.options = _extends({}, defaultOptions, options);

    _this._delayedDispatch = _this.options.delayedDispatch && _this.options.delayedDispatch(_this);

    // history of all current updates
    // in-recieved-order is for scuttlebutt, sorted for time travel
    _this._updates = [];
    _this._updateHistory = [];

    // history of store states after each action was applied
    _this._stateHistory = [];

    // redux methods to wrap
    _this._reduxDispatch = function () {
      throw new Error('Are you sure you called wrapDispatch?');
    };
    _this._reduxGetState = function () {
      throw new Error('Are you sure you called wrapGetState?');
    };
    return _this;
  }

  // wraps the redux dispatch


  _createClass(Dispatcher, [{
    key: 'wrapDispatch',
    value: function wrapDispatch(dispatch) {
      var _this2 = this;

      this._reduxDispatch = dispatch;

      return function (action) {
        // apply this action to our scuttlebutt model (and send to peers). It
        // will dispatch, taking care of the the appropriate time ordering
        if (isGossipType(action.type)) {
          _this2.localUpdate(action);
        } else {
          return dispatch(action);
        }
      };
    }

    // wraps getState to the state within orderedHistory

  }, {
    key: 'wrapGetState',
    value: function wrapGetState(getState) {
      this._reduxGetState = getState;

      return function () {
        return orderedHistory.getState(getState());
      };
    }

    // wraps the initial state, if any, into the first snapshot

  }, {
    key: 'wrapInitialState',
    value: function wrapInitialState(initialState) {
      return initialState && [,, initialState];
    }

    // rewinds history when it changes

  }, {
    key: 'wrapReducer',
    value: function wrapReducer(reducer) {
      var _this3 = this;

      this._historyReducer = orderedHistory.reducer(reducer);

      // wrap the root reducer to track history and rewind occasionally
      return function (currentState, action) {
        return _this3._historyReducer(currentState, action);
      };
    }

    // Apply update (action) to our store
    // implemented for scuttlebutt class

  }, {
    key: 'applyUpdate',
    value: function applyUpdate(update) {
      var _extends2;

      var _update = _slicedToArray(update, 3);

      var action = _update[0];
      var timestamp = _update[1];
      var source = _update[2];
      // add our metadata to the action
      var localAction = _extends({}, action, {
        meta: _extends({}, action.meta, (_extends2 = {}, _defineProperty(_extends2, _constants.META_TIMESTAMP, timestamp), _defineProperty(_extends2, _constants.META_SOURCE, source), _extends2))
      });

      // we log all updates to emit in the order we saw them.
      // not sure if it's better than replaying in order of timestamp (which might
      // cut down on the amount of time travelling done by all peers), but seems
      // like the de facto for scuttlebutt models
      this._updates.push(update);

      if (this._delayedDispatch) {
        this._delayedDispatch(localAction);
      } else {
        this._reduxDispatch(localAction);
      }

      // recieved message succesfully. if false, peers may retry the message.
      return true;
    }

    // gossip
    // implemented for scuttlebutt class

  }, {
    key: 'history',
    value: function history(sources) {
      return this._updates.filter(function (update) {
        return (0, _scuttlebutt.filter)(update, sources);
      });
    }

    // apply an update locally
    // we should ensure we don't send objects which will explode JSON.parse here
    // implemented over scuttlebutt class

  }, {
    key: 'localUpdate',
    value: function localUpdate(action) {
      if (process.env.NODE_ENV === 'development') {
        try {
          _get(Object.getPrototypeOf(Dispatcher.prototype), 'localUpdate', this).call(this, action);
        } catch (error) {
          throw new Error('Scuttlebutt couldn\'t dispatch', error);
        }
      } else {
        // try our luck
        _get(Object.getPrototypeOf(Dispatcher.prototype), 'localUpdate', this).call(this, action);
      }
    }

    // super.localUpdate(this._filterUpdate(action))
    // Recurse through the value and attempt to prune unserializable leaf objects.
    // A well-structured app won't be dispatching bad actions like this, so
    // this might become a dev-only check. also, it's far from foolproof.

  }, {
    key: '_filterUpdate',
    value: function _filterUpdate(value) {
      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') return value;

      if (value && value.constructor && /(^Synthetic|Event$)/.test(value.constructor.name)) return null;

      var result = {};
      for (var prop in value) {
        result[prop] = this._filterUpdate(value[prop]);
      }
      return result;
    }
  }]);

  return Dispatcher;
}(_scuttlebutt2.default);

exports.default = Dispatcher;