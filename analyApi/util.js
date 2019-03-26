const glob = require('glob');
const { join } = require('path');
module.exports.tmpClassPathName = '/class.analy.js';
const baseType = /(^Boolean$)|(^Double$)|(^Float$)|(^Integer$)|(^int$)|(^Long$)|(^Number$)|(^Object$)|(^Null$)|(^Short$)|(^String$)|(^StringBuffer$)|(^Void$)/i;

const sysJava = ["java.util.Date","java.util.Set","java.util.List","java.util.ArrayList"];

function isSystemJava(name){
  return sysJava.find(n=>n==name)!=null;
}


//返回传递给他的任意对象的类
function isClass(o){
  if(o===null) return "Null";
  if(o===undefined) return "Undefined";
  return Object.prototype.toString.call(o).slice(8,-1);
}
//深度克隆
function deepClone(obj){
  let result,oClass=isClass(obj);
      //确定result的类型
  if(oClass==="Object"){
      result={};
  }else if(oClass==="Array"){
      result=[];
  }else{
      return obj;
  }
  for(let key in obj){
      var copy=obj[key];
      if(isClass(copy)=="Object"){
        result[key]=deepClone(copy);//递归调用
      }else if(isClass(copy)=="Array"){
        result[key]=deepClone(copy);
      }else{
        result[key]=obj[key];
      }
  }
  return result;
}
module.exports.deepClone=deepClone;
module.exports.fieldName = function(name){
  if(/^set/.test(name)){
    return [name.charAt(3).toLowerCase()+name.substr(4),0];
  }else if(/^get/.test(name)){
    return [name.charAt(3).toLowerCase()+name.substr(4),1];
  }else if(/^is/.test(name)){
    return [name.charAt(2).toLowerCase()+name.substr(3),1];
  }else{
    return [null,2];
  }
}
//测试用例
// console.log(JSON.stringify(TType('BDto<List<String>>',{},''),null,2));
// console.log(JSON.stringify(TType('BDto<Map<String,String>>',{},''),null,2));
// console.log(JSON.stringify(TType('BDto<Map<String,String>,List<String>>',{},''),null,2));
/**
 * 
 * BDto<Map<String,String>>  返回
 * 1. {'.BDto':[]}  point=[m.BDTO,m]
 * 2. {'.BDto':[{'.Map':[]}]} point=[m.BDto[0].Map,m.BDTO,m]
 * BDto:{Map:[String,String]}
 * 
 */
function TType(text, impInfo, pack,hasClass){
  let tmp = text.replace(/\s*/g,''),tmpStr,m={},t,point=[m];
  while(tmp.length>0){
    tmpStr = stringAt(tmp,[',','<','>']);
    if (impInfo[tmpStr] != null) {
      t= impInfo[tmpStr];
    } else if (baseType.test(tmpStr)) {
      t= tmpStr;
    } else if(impInfo['*'] != null&&hasClass!=null){
      //如果有此类内容,则查看是无此类
      /**需要处理import java.util.*的情况 */
      const n = impInfo['*'].find(n=>isSystemJava(n+tmpStr)||hasClass(n+tmpStr));
      t = n==null?(pack + '.' + tmpStr):(n+tmpStr);
    }else {
      t= pack + '.' + tmpStr;
    }
    tmpStr!=null&&(tmp = tmp.substr(tmpStr.length));
    switch(tmp.substr(0,1)){
      case '<':
        if(Array.isArray(point[0])){
          point[0].push({[t]:[]});
          point.unshift(point[0][point[0].length-1][t]);
        }else{
          point[0][t] = [];
          point.unshift(point[0][t]);
        }
        break;
      case ',':
        point[0].push(t);
        break;
      case '>':
        tmpStr!=null&&point[0].push(t);
        point.shift();
        break;
      case '':
        break;
    }
    tmp = tmp.substr(1);
  }
  return toTrim(m);
}

function toTrim(v){
  if(typeof v=='string'){
    return v;
  }else if(Array.isArray(v)){
    for(let i=0;i<v.length;i++){
      v[i] = toTrim(v[i]);
    }
    return v.length==1?v[0]:v;
  }else{
    Object.keys(v).forEach(m=>{
      v[m] = toTrim(v[m]);
    })
    return v;
  }
}


module.exports.fetchType = function (type, impInfo, pack,hasClass) {
  if(/^Map$/i.test(type)){
    type = 'Map<String,Object>';
  }else if(/^java.util.List$/i.test(type)){
    type = 'List<Object>';
  }
  if(/</.test(type)){
    return TType(type, impInfo, pack,hasClass);
  }else{//无泛型的情况
    if (impInfo[type] != null) {
      return impInfo[type];
    } else if (baseType.test(type)) {
      return type;
    } else if(impInfo['*'] != null&&hasClass!=null){
      //如果有此类内容,则查看是无此类
      /**需要处理import java.util.*的情况 */
      const n = impInfo['*'].find(n=>isSystemJava(n+type)||hasClass(n+type));
      return n==null?(pack + '.' + type):(n+type);
    }else {
      return pack + '.' + type;
    }
  }
}

module.exports.fetchFiles = function (filePath) {
  return new Promise((resolve, reject) => {
    glob(join(filePath + "/**/*.java"), function (er, files) {
      // files 是匹配到的文件的数组.
      // 如果 `nonull` 选项被设置为true, 而且没有找到任何文件,那么files就是glob规则本身,而不是空数组
      // er是当寻找的过程中遇的错误
      if (er) {
        reject(er);
        return;
      }
      resolve(files);
    })
  });
}
/**f:{str:} */

function path2Obj(f, map) {
  if (!/<|>/.test(f.str)) {
    return map(f.str);
  }
  let r = [], tmpStr, upFlag = false;
  while (f.str != null && f.str != '') {
    let min = null;
    const t = f.str.indexOf(',');
    min = t == -1 ? min : t;
    const m = f.str.indexOf('<');
    min = m == -1 ? min : Math.min(min == null ? m : min, m);
    const n = f.str.indexOf('>');
    min = n == -1 ? min : Math.min(min == null ? n : min, n);
    if (min == null) {
      r.push(map(f.str));
      f.str = null;
      break;
    }
    tmpStr = f.str.substr(0, min);
    if (tmpStr == '') break;
    switch (f.str.charAt(min)) {
      case ',':
        f.str = f.str.substr(min + 1);
        r.push(map(tmpStr));
        break;
      case '<':
        f.str = f.str.substr(min + 1);
        let t = {}, re = path2Obj(f, map);
        t[map(tmpStr)] = re.length == 1 ? re[0] : re;
        r.push(t);
        break;
      case '>':
        f.str = f.str.substr(min + 1);
        r.push(map(tmpStr));
        upFlag = true;
        break;
    }
    f.str = f.str.replace(/^,/, '');
    if (upFlag) break;
  }
  return r;
}

module.exports.str2Path = path2Obj;
const pairChar = [[/\</g, /\>/g, '>', '<'], [/\{/g, /\}/g, '}', '{'], [/\(/g, /\)/g, ')', '(']];
function pair(str) {//需要忽略到//或者字符串中的匹配符号
  const newStr = pickSpecial(str);
  const first = newStr.charAt(0);
  let m = pairChar[first == '<' ? 0 : (first == '{' ? 1 : 2)];
  const tmp = newStr.substr(1).split(m[2]);
  let count = 0, i = 0, matchArr, index = 0;
  for (; i < tmp.length; i++ , count--) {
    matchArr = tmp[i].match(m[0]);
    count += matchArr == null ? 0 : matchArr.length;
    index += tmp[i].length + 1;
    if (count == 0) {
      break;
    }
  }
  return str.substr(0, index + 1);
}
module.exports.pair = pair;

function fetchClassWithT(str, left) {//需要忽略到//或者字符串中的匹配符号
  left = left || "<";
  let className, index, tType;
  const reg = new RegExp(`^[^\\s]+\\${left}`, "ig");
  if (reg.test(str)) {
    //说明有泛型支持
    index = str.indexOf(left);
    className = str.substr(0, index);
    tType = pair(str.substr(index));
  } else if (!/\s/.test(str)) {
    className = str;
  } else {
    index = str.indexOf(' ');
    className = str.substr(0, index);
  }
  return [className, tType];
}

module.exports.fetchClassWithT = fetchClassWithT;

function stringAt(str, arr, start) {//需要忽略到//或者字符串中的匹配符号
  start = start || 0;
  const newStr = pickSpecial(str);
  let m = -1;
  arr.forEach(idx => {
    const t = newStr.indexOf(idx, start + 1);
    t > start && (t < m || m == -1) && (m = t);
  })
  return m > start ? str.substr(0, m) : null;
}
module.exports.stringAt = stringAt;

function gWord(n) {
  let m = new Array(n);
  for (let i = 0; i < n; i++) {
    m[i] = '-';
  }
  return m.join('');
}
function stringAt1(str, arr, start) {//需要忽略到//或者字符串中的匹配符号
  start = start || 0;
  let m = -1;
  arr.forEach(idx => {
    const t = str.indexOf(idx, start + 1);
    t > start && (t < m || m == -1) && (m = t);
  })
  return m > start ? str.substr(0, m) : null;
}
//提取//或者"
function pickSpecial(str) {
  const lines = str.split('\r\n'), r = [];
  lines.forEach(l => {
    let tmp = l, count = 0, line = [], s1;
    while (true) {
      s1 = stringAt1(tmp, ['"', "//"], -1);
      if (s1 == null) {//没找到,肯定是代码
        line.push(tmp); break;
      } else if (tmp.charAt(s1.length) == '/') {
        if (count == 0) {
          //后面都是注释
          line.push(s1);
          line.push(gWord(tmp.length - s1.length));
          break;
        } else {
          //后面还是字符串的内容
          line.push(gWord(s1.length + 1));
          tmp = tmp.substr(s1.length + 1);
        }
      } else {
        //字符串,查看一下字符串前面是否有奇数转义符，有奇数个就忽略，说明是字符串中的内容
        if (count == 0) {
          //起启字符串
          line.push(s1 + gWord(1));
          tmp = tmp.substr(s1.length + 1);
          count = 1;
        } else {
          //判断前面是否有转义，有转奇数转意则表示依然是字符串
          if ((s1.length - s1.replace(/\/*$/g, '').length) % 2 == 0) {
            //字符串结束位
            count = 0;
          }
          line.push(gWord(s1.length + 1));
          tmp = tmp.substr(s1.length + 1);
        }
      }
    }
    r.push(line.join(''));
  })
  return r.join('\r\n');
}

/***注解解析 */
function annoValue(anno) {
  if (anno == null) return null;
  anno = anno.replace(/^@[a-zA-Z0-9_]+\(\s*|\s*\)\s*$/g, '');
  const key = stringAt(anno, ['='], -1);
  if (key == null) {
    return { value: anno.replace(/^['"']|['"]$/g, '') };
  } else {
    let r = {}, k, v;
    while (true) {
      k = stringAt(anno, ['=']);
      if (k == null) break;
      anno = anno.substr(k.length + 1);
      v = stringAt(anno, [',']);
      if (v == null) {
        r[k.trim()] = anno.trim().replace(/^['"']|['"]$/g, '').trim();
        break;
      }
      anno = anno.substr(v.length + 1);
      r[k.trim()] = v.trim().replace(/^['"']|['"]$/g, '').trim();
    }
    return r;
  }
}

module.exports.annoValue = annoValue;


//测试用例
// console.log(annoValue("@RequestMapping(value=\"/login\",method = RequestMethod.POST)"));
// console.log(annoValue("@Validator({ValidType.NOT_BLANK})"));
// const word = "{\"faffadf}df\"}\\afadfas\"dfasdf\npublic class";
// const t = pickSpecial(word);
// console.log(word.length,t.length,t)
// console.log(pair("{fafdadf\"afad)f}\"faf)asd}\\)()af\ndf)dfadf"));
