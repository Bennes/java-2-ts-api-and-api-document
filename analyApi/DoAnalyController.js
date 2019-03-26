const {deepClone} = require('./util');
const fs = require('fs');
const {tmppath,controller} = require('../conf');
const {join} = require('path');
const {AnalyController,AnalyPojo,AnalyTType} = require('./ControllerAnaly');

const classes = require('allClass');
/**
 * 结构:id:idx,建立class索引
 */
const tmpClasses = {}

/**
 * Pojo的解析结果
 */
const PojoClasses = {

}
//初始化class接口
classes.forEach((clz,idx) => {
  tmpClasses[`${clz.package}.${clz.class}`] = idx
});

function PojoCache(id){
  if(typeof id=='string'){
    if(PojoClasses[id]!=null){
      return deepClone(PojoClasses[id]);
    }
    console.info(id);
    if(classes[tmpClasses[id]].T.length==0){//存在泛型,不保存
      PojoClasses[id] = AnalyPojo(classes[tmpClasses[id]],PojoCache,hasClass);
      return PojoClasses[id];
    }else{
      return classes[tmpClasses[id]];
    }
  }else{
    //泛型处理
    return AnalyTType(id,PojoCache,hasClass);
  }
}
//为了解决java.util.*类似的情况
function hasClass(id){
  return tmpClasses[id]!=null;
}

function start(){
  classes.forEach(clz=>{
    const isController = clz.anno.find(m=>controller.isController.test(m));
    if(isController==null){
    // if(isController==null 
    //   ||clz.class!='UserController'){//不是controller,则离开
      return;
    }

    //如果是的创建对应的文件夹及文件
    const d = '\\api\\'+clz.package.split(controller.path)[1];
    //创建对应目录
    if(!fs.existsSync(join(tmppath,d))){
      fs.mkdirSync(join(tmppath,d));
    }
    console.info(`开始解析:${clz.package}.${clz.class}`);
    fs.writeFile(join(tmppath,d,'\\'+clz.class+'.js'),
      `module.exports = ${JSON.stringify(AnalyController(clz,PojoCache,hasClass),null,2)}`,(err)=>{
        if(err){
          console.error('解析失败',clz.package,clz.class,err);
          return;
        }
        console.log('解析完成',clz.class)
    });
  })
}

start();