'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// keys added to the action's meta property
var META_TIMESTAMP = exports.META_TIMESTAMP = '@@scuttlebutt/TIMESTAMP';
var META_SOURCE = exports.META_SOURCE = '@@scuttlebutt/SOURCE';

// update and state history structure keys
var UPDATE_ACTION = exports.UPDATE_ACTION = 0,
    UPDATE_TIMESTAMP = exports.UPDATE_TIMESTAMP = 1,
    UPDATE_SOURCE = exports.UPDATE_SOURCE = 2,
    STATE_ACTION = exports.STATE_ACTION = 0,
    STATE_TIMESTAMP = exports.STATE_TIMESTAMP = 1,
    STATE_SNAPSHOT = exports.STATE_SNAPSHOT = 2;