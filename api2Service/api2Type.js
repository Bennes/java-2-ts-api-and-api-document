function firstUpper(text){
  return text.substr(0,1).toUpperCase()+text.substr(1);
}


module.exports.formatName = function(url){
  const r = [];
  url.split(/\//).forEach((m,idx)=>{
    if(idx==0){
      return;
    }else{
      r.push(firstUpper(m));
    }
  })
  return r.join('');
}


function fetchType(param,reqName){
  let r = [];
  if(!param[reqName]){
    r.push('?')
  }
  r.push(':');
  if(param.type=='object'){//取param.value
    if(param.value==null){r.push('any')}
    else{
      r.push(`{[key:string]:${fetchType(param.value,reqName).replace(/^\?{0,1}:/,'')}}`)
    }
  }else if(param.type=='array'){//取param.value
    r.push(`${fetchType(param.value,reqName).replace(/^\?{0,1}:/,'')}[]`)
  }else if(typeof param.type=='string'){
    r.push(param.type);
  }else if(param.type.type!=null&&(param.type.type=='object'||param.type.type=='array')){
    if(param.type.type=='array'&&reqName!='isRequired'){
      //去除arr的问号
      //console.info(param.type.type,reqName=='isRequired')
      r=[':'];
    }
    return r.join('')+fetchType(param.type,reqName).replace(/^\?{0,1}:/g,'');
  }else{
    r.push('{');
    Object.keys(param.type).forEach((m,idx)=>{
      idx>0?r.push(','):'';
      r.push(m);
      r.push(fetchType(param.type[m],reqName))
    })
    r.push('}');
  }
  return r.join('');
}

module.exports.formatParam = function(param){
  let r = ['{'];
  Object.keys(param).forEach((m,idx)=>{
    idx>0?r.push(','):'';
    r.push(m);
    r.push(fetchType(param[m],'isRequired'))
  });
  r.push('}')
  return r.join('');
}


module.exports.formatResult = function(result){
  let r = ['{result'];
  result.returnNotNull=true;
  r.push(fetchType(result,'returnNotNull'))
  r.push('}')
  return r.join('').replace(/^\{result:|\}$/g,'');
}