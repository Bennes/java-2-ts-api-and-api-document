global.path = require('path');
global.fs = require('fs');
global.conf = require('../conf');
global.ejs = require('ejs');
global.classTools = function(m){
  return require(m);
}
require('./js/DoDoc');