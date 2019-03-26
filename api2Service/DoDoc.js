const {apiDoc,apiRest,tmppath} = require('../conf');
const ejs = require('ejs');
const fs = require('fs');
const {join} = require('path');
const fetchClass = require('classTools')

if(!fs.existsSync(join(apiDoc,'./api'))){
  fs.mkdirSync(join(apiDoc,'./api'));
}
const data = fs.readFileSync(join(apiDoc,'./index.js'),{
  encoding:"utf-8"
});
const content = JSON.parse(data.replace(/(^\s*const\s+data\s*=\s*)|(\;\s*$)/g,''));


Array.prototype.last = function(){
  return this.length==0?null:this[this.length-1];
}
Date.prototype.format = function (fmt) {
  var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
          .substr(4 - RegExp.$1.length));
  for (var k in o)
  if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k] ).length)));
  return fmt;
}


const template = fs.readFileSync(join(apiDoc,'./template.html'),{
  encoding:"utf-8"
});

function mutation(arr) {
  // 请把你的代码写在这里
  var a = arr[0].toLowerCase(); //第一个字符串 转小写
  var b = arr[1].toLowerCase(); //第二个字符串 转小写
  for(var i=0;i<b.length;i++){
    if(b.length<i)return true;
    const m =a.charCodeAt(i),n=b.charCodeAt(i);
    if(m!=n){
      return m-n>0?true:false;
    }
  }
  return true;
}

//{"roleIds":{"type":{"type":"array","value":{"type":"number"}},"isRequired":true,"paramType":"set"},"userId":{"type":"number","isRequired":true,"paramType":"set"}}
function fetchType(type,isSet){
  // console.log(type);
  if(type=='object'){//取param.value
    if(type.value==null) return {type:"object"};
    const p = fetchType(type.value,isSet);
    if(typeof p=='string'){
      return `{[key:string]:${p}}`;
    }
    return {type:'object',detail:p};
  }else if(type=='array'){//取param.value
    const p = fetchType(type.value,isSet);
    if(typeof p=='string'){
      return p+'[]';
    }
    return {type:'object[]',detail:p};
  }else if(typeof type=='string'){
    return type;
  }else if(type.type!=null&&(type.type=='object'||type.type=='array')){
    if(type.type=='array'){
      const p =  fetchType(type.value.type,isSet);
      if(typeof p=='string'){
        return p+'[]';
      }
      return {type:'object[]',detail:p.detail};
    }
    return fetchType(type.value.type,isSet);
  }else{
    const detail=[];
    let typeR;
    Object.keys(type).forEach(m=>{
      typeR = fetchType(type[m].type,isSet);
      detail.push({
        name:m,
        [isSet?'isRequired':'isReturnNotNull']:isSet?type[m].isRequired:type[m].returnNotNull,
        note:type[m].note==null?"":type[m].note.replace(/(^\/)|(\/$)|(\<br\>)|([\r\n\*])|(\s*)/g,'').trim(),
        ...((typeof typeR=='string')?{type:typeR}:typeR)
      })
    })
    detail.sort((m1,m2)=>{
      const p1 = m1.isRequired||m1.isReturnNotNull;
      const p2 = m2.isRequired||m2.isReturnNotNull;
      if(p1==p2){
        return mutation([m1.name,m2.name])?1:-1;
      }else{
        return p1?-1:1;
      }
    })
    return {type:'object',detail}
  }
}

const APIS = [];


Object.keys(apiRest).forEach(m=>{
  const api = fetchClass(join(tmppath,`./api/${m.replace(/\./g,'/')}.js`));
  const name = m.replace(/^([^\.]+\.)*|Controller$/g,'');
  const pack = m.replace(/\.[\s\S]*$/g,'');
  let p = content.find(c=>c.name==pack);
  if(p==null){
    p={name:pack,list:[name]};
    content.push(p);
  }else{
    if(p.list.find(n=>n==name)==null){
      p.list.push(name);
    }
  }


  APIS.push({
    name,
    date:new Date().format('yyyy-MM-dd hh:mm:ss'),
    list:[]
  });

  api.forEach(action=>{
    if(apiRest[m]!=null&&apiRest[m].find(j=>j==action.url)==null)return;
    APIS.last().list.push({
      name:action.note==null?"未注释":action.note.replace(/^[^\u4e00-\u9fa5]*/g,'').replace(/[\r\n][\s\S]*$/g,''),
      url:action.url,
      action:action.action,
      params:fetchType(action.params,true).detail,
      result:fetchType(action.result.type,false).detail
    })
  })
});


APIS.forEach(m=>{
  const html = ejs.render(template,m)
  fs.writeFile(join(apiDoc,`./api/${m.name}.html`),html,(err)=>{
    if(err){
      console.error(`${m.name}生成文档失败`,err);
      return;
    }
    console.info(`${m.name}生成文档`);
  })
});

content.sort((c1,c2)=>{
  return mutation([c1.name,c2.name])?1:-1;
});
content.forEach(m=>{
  m.list.sort((m1,m2)=>{
    return mutation([m1,m2])?1:-1;
  });
});

fs.writeFile(join(apiDoc,'./index.js'),`const data=${JSON.stringify(content)}`,(err)=>{
  if(err){
    console.error('doc/index.js更新失败',err)
  }
})