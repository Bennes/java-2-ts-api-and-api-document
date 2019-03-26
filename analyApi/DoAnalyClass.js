const { join } = require('path');
const { appendFileSync, writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { classpath, tmppath } = require('../conf');
const { fetchFiles, tmpClassPathName } = require('./util')
const { AnalyClass } = require('./ClassAnaly');
const apiPath = join(tmppath, '/api');
if (!existsSync(tmppath)) {
  mkdirSync(tmppath);
  mkdirSync(apiPath)
} else if (!existsSync(apiPath)) {
  mkdirSync(apiPath)
}

const debuggerFlag = false;

const analyPath = Array.isArray(classpath) ? classpath : [classpath];

async function analy() {
  let allFiles = [];
  for (let i = 0; i < analyPath.length; i++) {
    allFiles = [...allFiles, ...await fetchFiles(analyPath[i])];
  }
  const dist = join(tmppath, tmpClassPathName);
  writeFileSync(dist, 'module.exports=[\n');
  allFiles.forEach((f, idx) => {
    const fContext = readFileSync(f, 'utf-8');
    if (!/public\s+(final\s+|abstract\s+)?class/.test(fContext)) {
      //接口不作解析
      return;
    }
    const filename = f.match(/[A-Za-z]+\.java$/)[0];
    if (!debuggerFlag || (debuggerFlag && filename == 'DeviceGroupController.java')) {
      console.log("开始解析文件:", f);
      appendFileSync(dist, (idx > 0 ? ',' : "") + JSON.stringify(AnalyClass(fContext), null, 2));
    }
  })
  appendFileSync(dist, '\n];');
}


analy().then(() => {
  console.log('============全部解析完成=======');
}).catch(err => {
  console.error("解析文件异常:", err);
})