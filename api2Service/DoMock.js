const {mock,rest,tmppath} = require('../conf');
const {mockData,analyApi} = require('./mockData');
const {join,sep} = require('path');
const fs = require('fs');


const mockCfg = require("mockCfg");
const classTools = require('classTools');
const apiSrc = join(tmppath,'/api');

const createPath = {};
function mkdir(pathStr){
  if(createPath[pathStr])return;
  if(fs.existsSync(pathStr)){
    createPath[pathStr]=true;
    return;
  }

  const p = pathStr.split(sep);
  let i;
  for(i=p.length-1;i>0;i--){
    if(fs.existsSync(p.slice(0,i).join(sep))){
      break;
    }
  }
  for(let j=i+1;j<=p.length;j++){
    fs.mkdirSync(p.slice(0,j).join(sep));
  }
  createPath[pathStr]=true;
}


const files = Object.keys(rest);
const analyFiles = {};
files.forEach(m=>{
  analyFiles[join(apiSrc,sep+m.replace(/\./g,sep))] = {reg:rest[m]==null?/[\s\S]*/:new RegExp(
    `(^${(typeof rest[m]=='string'?[rest[m]]:rest[m]).join('$)|(^')}$)`.replace(/\{/g,'\\{').replace(/\}/g,'\\}'),'i'
  ),dist:join(mock.dist,sep+'data'+sep+m.replace(/\./g,sep)+'.json')};

  mkdir(join(mock.dist,sep+'data'+sep+m.replace(/\.[^.]+$/,'').replace(/\./g,sep)));
});

function start(){
  let writeFlag=true;
  Object.keys(analyFiles).forEach(m=>{
    const req = classTools(m);
    let oneFile = ['['],idx=0;
    writeFlag=true;
    req.forEach((node)=>{
      if(!analyFiles[m].reg.test(node.url)){
        return;
      }
      const [api,flag] = analyApi('result',node.result,mockCfg,node.url,true,0,1);
      writeFlag&&(writeFlag=flag);
      if(writeFlag){
        oneFile.push((idx>0?',':'')+JSON.stringify({
          url:node.url,
          result:mockData(api).result,
          method:node.action
        },null,2));
        idx++;
      }
    });
    if(writeFlag){
      fs.writeFileSync(analyFiles[m].dist,oneFile.join('')+']');
    }
  });
  fs.writeFile(join(mock.dist,sep+'mock.conf.js'),`module.exports=${JSON.stringify(mockCfg,null,2)}`,(err)=>{
    if(err){
      console.error('重置Mock对应的fields失败');
      return;
    }
    if(!writeFlag){
      console.info('请更新mock的配置信息,将其中的null定义成对应的类型')
    }else{
      console.info('mock数据生成完成')
    }
  })
}
start();