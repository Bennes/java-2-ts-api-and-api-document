const { tmppath, apiDist, rest, typeService, manualApi } = require('../conf');
const { join, sep } = require('path');
const { formatParam, formatResult, formatName } = require('./api2Type');

const fs = require('fs');

const apiSrc = join(tmppath, '/api');

const fetchClass = require('classTools')

const createPath = {};

function mkdir(pathStr) {
  if (createPath[pathStr]) return;
  if (fs.existsSync(pathStr)) {
    createPath[pathStr] = true;
    return;
  }

  const p = pathStr.split(sep);
  let i;
  for (i = p.length - 1; i > 0; i--) {
    if (fs.existsSync(p.slice(0, i).join(sep))) {
      break;
    }
  }
  for (let j = i + 1; j <= p.length; j++) {
    fs.mkdirSync(p.slice(0, j).join(sep));
  }
  createPath[pathStr] = true;
}


const files = Object.keys(rest);
const analyFiles = {};
files.forEach(m => {
  analyFiles[join(apiSrc, sep + m.replace(/\./g, sep))] = {
    reg: rest[m] == null ? /[\s\S]*/ : new RegExp(
      `(^${(typeof rest[m] == 'string' ? [rest[m]] : rest[m]).join('$)|(^')}$)`.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'i'
    ), dist: join(apiDist, sep + m.replace(/\./g, sep) + '.ts')
  };
  mkdir(join(apiDist, m.replace(/\.[^.]+$/, '').replace(/\./g, sep)));
});
function start() {
  Object.keys(analyFiles).forEach(m => {
    const req = fetchClass(m);
    let oneFile = [typeService.header];
    req.forEach(node => {
      if (!analyFiles[m].reg.test(node.url)) {
        return;
      }
      console.info('开始解析:',node.url);
      const urlName = formatName(node.url.replace(/\{|\}/g, ''));
      const params = formatParam(node.params);
      const result = formatResult(node.result);
      const type = node.action.toUpperCase();
      oneFile.push(typeService.req({ params, result, actionType: type, urlName, url: node.url }));
    });
    fs.writeFileSync(analyFiles[m].dist, oneFile.join('\n'), (err) => {
      if (err) {
        console.error('服务生成失败:', analyFiles[m].dist)
        return;
      }
      console.log('服务生成成功:', analyFiles[m].dist)
    })
  })
  //如果有手动定义的typescript,则进行拷贝
  if (manualApi == null) return;
  exists(manualApi,apiDist,copy);
}

const stat = fs.stat;
var copy = function (src, dst) {
  // 读取目录中的所有文件/目录
  fs.readdir(src, function (err, paths) {
    if (err) {
      throw err;
    }

    paths.forEach(function (path) {
      var _src = src + '/' + path,
        _dst = dst + '/' + path,
        readable, writable;

      stat(_src, function (err, st) {
        if (err) {
          throw err;
        }

        // 判断是否为文件
        if (st.isFile()) {
          // 创建读取流
          readable = fs.createReadStream(_src);
          // 创建写入流
          writable = fs.createWriteStream(_dst);
          // 通过管道来传输流
          readable.pipe(writable);
        }
        // 如果是目录则递归调用自身
        else if (st.isDirectory()) {
          exists(_src, _dst, copy);
        }
      });
    });
  });
};
// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function (src, dst, callback) {
  fs.exists(dst, function (exists) {
    // 已存在
    if (exists) {
      callback(src, dst);
    }
    // 不存在
    else {
      fs.mkdir(dst, function () {
        callback(src, dst);
      });
    }
  });
};

start();