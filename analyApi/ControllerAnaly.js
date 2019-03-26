const {baseType,ignoreParam,convertType,valid,controller,listType,keyValueType} = require('../conf');
const {annoValue,fetchType,fieldName} = require('./util');
/**
 * 解决泛型未提供类型的情况
 */
function defaultType(type,fetchPojo){
  if(typeof type=='string'&&!baseType.test(type)){
    const clz = fetchPojo(type);
    if(`${clz.package}.${clz.class}`==type&&clz.T.length>0){
      return {[type]:clz.T.length==1?'Null':['Null','Null','Null','Null','Null','Null','Null','Null'].slice(0,clz.T.length)};
    }else{
      return type;
    }
  }
  return type;
}

const ParamTypeEnum = {
  set:"set",  
  get:"get"
}
function AnalyController(control,fetchPojo,hasClass){
  let result = {methods:[]},urlPath;
  //顶部url
  urlPath = control.anno.find(m=>controller.urlAnno.test(m));
  if(urlPath==null){
    result.topPath = '';
  }else{
    result.topPath = annoValue(urlPath).value+'/';
  }

  control.methods.forEach(m=>{
    urlPath = m.anno.find(n=>controller.urlAnno.test(n));
    if(urlPath==null)return;
    result.methods.push({
      note:m.note,
      ...controller.action(annoValue(urlPath),result.topPath),
      ...analyMethod(m,fetchPojo,control.imports,control.package,hasClass)
    })
  })
  result.methods.forEach(m=>{
    m.url = m.url.replace(/\/\//g,'/');
    //把param中的get去除，将result中的set去除
    trimSuffix(m.params,'get');
    trimSuffix(m.result,'set');
  })
  return result.methods;
}

function trimSuffix(params,remove){
  if(typeof params.type=='string'||(params.type!=null&&(params.type.type=='object'||params.type.type=='array'))){//object与array要特殊处理
    if(params.type!=null&&(params.type.type=='object'||params.type.type=='array')){
      trimSuffix(params.type.value,remove);
    }
    return;
  }
  let isParam = false;
  if(remove=='get'){
    isParam = true;
  }
  if(params.type!=null){
    params = params.type;
  }
  Object.keys(params).forEach(m=>{
    if((isParam && /_get$/.test(m))||(!isParam && /_set$/.test(m))){
      delete params[m];
    }else{
      if(typeof params[m].type!='string'){
        trimSuffix(params[m],remove);
      }
      if(/_set$|_get$/.test(m)){
        params[m.replace(/_set$|_get$/,'')] = params[m];
        delete params[m];
      }
    }
  })
  return;
}




function fetchClassType(child,fetchPojo,hasClass){
  if(typeof child=='string'&&baseType.test(child)){
    return convertType(child);
  }else if(typeof child=='string'&&!baseType.test(child)){
    return {type:fetchPojo(child,fetchPojo)};
  }else{
    return {type:AnalyTType(child,fetchPojo,hasClass)};
  }
}

/***函数解析，
 * 返回params,result
 */
function analyMethod(method,fetchPojo,impInfo,pack,hasClass){
  let result = {params:{},result:{}},annoObj;
  //如果是controller,并且只有一个参数的时候,外部的
  method.params.forEach(m=>{
    if(ignoreParam.test(m.type))return;
    const dType = defaultType(fetchType(m.type,impInfo,pack,hasClass),fetchPojo);
    annoObj = annoValue(m.anno.find(n=>valid.anno.test(n)));
    let isRequired = true;
    if(annoObj==null||valid.canBlack(annoObj)){
      isRequired = false;
    }
    if(typeof dType=='string'&&baseType.test(dType)){
      const t = convertType(dType);
      result.params[m.name+"_set"] = {
        ...t,
        isRequired,
        note:m.note,
        paramType:ParamTypeEnum.set
      };
    }else{
      //非基础类型,可能存在泛型
      result.params[m.name] = {
        type:fetchPojo(dType),
        isRequired,
        note:m.note,
        paramType:ParamTypeEnum.set
      }
    }
  })

  const dType = defaultType(fetchType(method.type,impInfo,pack,hasClass),fetchPojo);
  if(typeof dType=='string'&&baseType.test(dType)){
    const t = convertType(dType);
    annoObj = method.anno.find(n=>valid.result.test(n));
    result.result = {
      ...t,
      returnNotNull:annoObj!=null,
      paramType:ParamTypeEnum.get
    };
  }else{
    //非基础类型,可能存在泛型
    result.result = {
      type:fetchPojo(dType),
      returnNotNull:annoObj!=null,
      paramType:ParamTypeEnum.get
    };
  }
  const l = Object.keys(result.params);
  if(l.length==1&&typeof result.params[l[0]].type!='string'&&result.params[l[0]].type.type!='array'){
    result.params = result.params[l[0]].type;
  }
  return result;
}

module.exports.AnalyController = AnalyController;

/**解析POJO */
function AnalyPojo(pojo,fetchPojo,hasClass){
  let r = {};

  pojo.exts.forEach(m=>{
    r = {...r,...fetchPojo(defaultType(fetchType(m,pojo.imports,pojo.package,hasClass),fetchPojo))};
  })

  //解析set,get函数
  pojo.methods.forEach(m=>{
    const [name,tmp1] = fieldName(m.name);
    if(tmp1==2)return;
    
    const field = pojo.fields.find(n=>n.name==name);
    if(tmp1==0){//set函数
      if(m.params.length!=1)return;
      let tmp2 = fetchClassType(defaultType(fetchType(m.params[0].type,pojo.imports,pojo.package,hasClass),fetchPojo),fetchPojo,hasClass),annoObj;

      annoObj = field==null?null:annoValue(field.anno.find(n=>valid.anno.test(n)));
      let isRequired = true;
      if(annoObj==null||valid.canBlack(annoObj)){
        isRequired = false;
      }

      r[name+"_set"] = {
        ...tmp2,
        paramType:ParamTypeEnum.set,
        note:field==null?null:field.note,
        isRequired
      }
    }else{//get函数
      if(m.params.length!=0)return;
      let tmp2 = fetchClassType(defaultType(fetchType(m.type,pojo.imports,pojo.package,hasClass),fetchPojo),fetchPojo,hasClass),annoObj;
      annoObj = field==null?null:annoValue(field.anno.find(n=>valid.result.test(n)));

      r[name+"_get"] = {
        ...tmp2,
        paramType:ParamTypeEnum.get,
        note:field==null?null:field.note,
        returnNotNull:annoObj!=null
      }
    }
  })
  return r;
}

module.exports.AnalyPojo = AnalyPojo;

/**
 * 解析泛型{java.util.ArrayList:{java.util.Map:[String,String]}}
 */
function AnalyTType(tType,fetchPojo,hasClass){
  /**特殊Map,HashMap,Set,HashSet,List,ArrayList */
  const type = Object.keys(tType)[0];
  if(listType.test(type)){
    //说明是数组
    let child = tType[type],cType;
    cType = fetchClassType(child,fetchPojo,hasClass);
    return {
      type:"array",
      value:cType
    }
  }else if(keyValueType.test(type)){
    //说明是动态类型,必然是string:Object
    let child = tType[type][1],cType;
    cType = fetchClassType(child,fetchPojo,hasClass);
    return {
      type:"object",
      value:cType
    }
  }

  // /**将泛型替换掉 */
  const struct = fetchPojo(type,fetchPojo);
  struct.T.forEach((m,idx)=>{
    struct.imports[m] = struct.T.length==1?tType[type]:tType[type][idx];
  })

  return AnalyPojo(struct,fetchPojo,hasClass);
}

module.exports.AnalyTType = AnalyTType;
