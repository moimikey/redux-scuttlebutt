'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rewind = rewind;
var actionTypes = exports.actionTypes = {
  REWIND: '@@scuttlebutt/REWIND'
};

function rewind(action) {
  return {
    type: actionTypes.REWIND,
    payload: action
  };
}