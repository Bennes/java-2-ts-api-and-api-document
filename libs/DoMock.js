global.path = require('path');
global.fs = require('fs');
global.conf = require('../conf');
global.mockjs = require('mockjs');
global.mockCfg = require('../mock/mock.conf');
global.classTools = function(m){
  return require(m);
}
require('./js/DoMock');