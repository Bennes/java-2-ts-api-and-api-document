const Mock = require('mockjs');
//将result解析成想要的格式
function analyApi(key, result, map, url, isRoot,idx,rootIdx) {
  let r = {},flag=true,api;
  idx = (idx||0)+1,rootIdx=rootIdx||1;
  if (result.type == 'object') {
    if (map.urls[url] == null || map.urls[url][key] == null || map.urls[url][key].length == 0 || map.urls[url][key][0] == null) {
      map.urls[url] = map.urls[url] || {};
      map.urls[url][key] = [null];
      console.info(`未配置url(${url})：Map中${key}有哪些项,请配置好后重新生成`);
      flag=false;
    } else {
      r[key] = {};
      map.urls[url][key].forEach(m => {
        api = analyApi(m, result.value, map, url, idx <= rootIdx,idx,rootIdx);
        r[key][m+'|1'] = api[0];
        flag&&(flag=api[1]);
      })
    }
  } else if (result.type == 'array') {
    //如果是root就从url里取
    if (result.value.type == 'string' || result.value.type == 'number' || result.value.type == 'boolean') {
      if (isRoot&&map.fields[key]==null) {
        if (map.urls[url] == null || map.urls[url][key] == null) {
          map.urls[url] = map.urls[url] || {};
          map.urls[url][key] = [null];
          console.info(`未配置url(${url})：Map中${key}有哪些项,请配置好后重新生成`);
          flag=false;
        } else {
          r[key + '|1-15'] = map.urls[url][key]
        }
      } else {
        if (map.fields[key] == null) {
          map.fields[key] = null;
          console.info(`未配置fields(${key})：请配置好后重新生成`);
          flag=false;
        } else {
          r[key + '|1-15'] = map.fields[key];
        }
      }
    } else {
      api = analyApi(key, result.value, map, url, idx <= rootIdx,idx,rootIdx);
      flag&&(flag=api[1]);
      r[key + '|1-15'] = [api[0]];
    }
  } else if (typeof result.type == 'string') {
    if (isRoot&&map.fields[key]==null) {
      if (map.urls[url] == null || map.urls[url][key] == null) {
        map.urls[url] = map.urls[url] || {};
        map.urls[url][key] = [null];
        console.info(`未配置url(${url})：Map中${key}有哪些项,请配置好后重新生成`);
        flag=false;
      } else {
        if(result.type=='number'){
          r[key + '|'+ map.urls[url][key]] = 1;
        }else{
          r[key + '|1'] = map.urls[url][key]
        }
      }
    } else {
      if (map.fields[key] == null) {
        map.fields[key] = null;
        console.info(`未配置fields(${key})：请配置好后重新生成`);
        flag=false;
      } else {
        if(result.type=='number'){
          r[key + '|'+ map.fields[key]] = 1;
        }else{
          r[key + '|1'] = map.fields[key];
        }
      }
    }
  } else if(result.type.type!=null&&(result.type.type=='object'||result.type.type=='array')){
    api = analyApi(key,result.type.value,map,url,isRoot,idx-1,rootIdx);
    flag&&(flag=api[1]);
    if(result.type.type=='object'){
      r = api[0];
    }else{
      if(typeof Object.values(api[0])[0]=='number'){
        let arr = [];
        Mock.mock({'list|1-15':[api[0]]}).list.forEach(m=>{
          arr.push(m[key]);
        })
        r[key] = arr;
      }else{
        r[key+'|1-15'] = [api[0][key]];
      }
    }
  }else{
    //对象
    r[key] = {};
    Object.keys(result.type).forEach(m=>{
      api = analyApi(m,result.type[m],map,url, idx <= rootIdx,idx,rootIdx);
      flag&&(flag=api[1]);
      r[key] = {
        ...r[key],
        ...api[0]
      };
    })
  }
  return [r,flag];
}
module.exports.analyApi= analyApi;
module.exports.mockData = function(cfg){
  return Mock.mock(cfg);
}