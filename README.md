# java源码转化为typescript api工程

#### 介绍


将日常工作中，有规则的springMVC java代码提取成typescript工程的api和生成api文档

api文档如图：
![输入图片说明](https://images.gitee.com/uploads/images/2019/0325/180540_9991fe62_1515873.png "微信截图_20190325180456.png")

此工程是基于nodejs的工程，可通过webpack压缩打包,

    1.解决的问题：用上此工具包后，没有问后端要过接口文档，最多问一句，你代码提交了吗？
    2.建议前端全部使用typescript,最大的好处是将问题截杀在开发中【本人所有项目都是typescript，包括微信小程序的项目】


该工程只要你克隆下来后，配置不需要改也是能跑成功的，执行其中的安装教程、使用说明即可

#### 软件架构
基于正则表达式，将规范性的java代码解析成特定格式，支持生成ts-api和文档

同时支持基于api,利用mockjs生成mock数据

#### 安装教程

1. 安装nodejs
2. 克隆该工程
3. 在工程中调用 npm install
4. 执行:npm run build,生成使用解析工具(生成到libs目录下)


#### 使用说明

> 以demo为示例
> 1. 将整个libs拷贝到demo目录下
> 2. 将./conf.js、./local.js文件和./mock、./doc目录拷贝到demo目录下
> 3. 配置local.js目录为同目录下的java【该目录视项目情况而定】
> 4. 配置conf.js,语意请参考其中的注释
> 5. 分5步完成整个过程: 
    <br/>a. 解析所有class,执行:npm run aClass
    <br/>b. 寻找controller,并递归查询各接口对应的入参与返回，执行:npm run aController
    <br/>c. 生成typescript对应的api接口，执行:npm run aApi
    <br/>d. 生成接口文档，执行:npm run aDoc
    <br/>e. 生成mock数据，执行:npm run aMock
>
>   <br/> c、d、e三步按需执行，也可一步调用npm run api完成a,b,c,d步骤

  成果目录说明
> api目录：提供给前端使用
>
> doc目录：双击打开index.html，查看接口文档
>
> mock/data目录:生成的mock数据，前端请求拦截返回，实现mock测试或开发

#### 参与贡献

1. 您有意向，可微信我，看情况待定,当然捐助方式的贡献，热烈欢迎，毕竟我也要吃饭；【微信:zx86250268;qq:86250268;加好友请说明来源】
2. 如果您希望该程序可以依据您的公司做一些定制，本人接收有偿定制；【我算一个比较穷的程序员，望能体谅】
3. 请放心使用，虽然个人是穷了点，版本还是干干净净的，所有代码都是在创业状态下编写;

<pre>说明：该工具在我的几个项目中已经应用半年多，情况良好；
但使用的基础是围绕着我们内部定义的标准，并没有全部解析掉java的语法，碰到一个解析一个，
实际情况是，半年时间，我只遇到过两种语法情况追加，请知析（尽量统一规范实现）
</pre>

##### 后续说明

  此工程属于我前端工程中很小的一部分，但作用很大，减少了很多沟通和变更成本；因为当前团队人数有限，有很多权限控制的功能未做开发，但扩展并非困难，我列一下几点，实际情况可能需要：

    1.后台多工程权限控制，没有权限的情况下也要生成代码；（已支持，将class解析后的内容接供即可）；

    2.前端开发者只能生成api，不能生成所有文档，无java权限；（未支持，可将本地源改为网络源即可，通过网络源来控制权限）；

    3.多版本管理；（未支持，各个api需要标记对应版本号）

    4.其他想法，有兴趣了在微信沟通，希望对您有用；


如果对我的整个前端框架感兴趣，那静请期待我的分享；
框架上实现五端合一(pc端、h5移动端、android、IOS、微信小程序)；
理论上支持Vue、react、angular、jquery各类组件库，
实际情况是PC用的是Vue+ElementUI,小程序用的是iView,h5用的是Vant,android和ios用的是weex;
至于快应用和支付宝小程序、百度小程序，关注的比较少，理论上整合问题不大。

    整个前端框架并不建议实现一次编写多处应用，而是采用将不同的保持不同，
    将相同部分抽离共享的方式，对前端团队的人力分工会有影响，
    但可提高工作效率[自我评估，1个我+4个熟练的实习生能吃掉5个端：）牛皮先吹起来]；
    整个前端框架进行了模块化开发，如果要维护最好熟练撑握领域、MVVM及容器、通道、
    事件的概念及Vue和typescript、webpack分包的技术，支持了类java的模块加载工程；


  至于后端的分布式框架，咱有机会在聊，如果有项目合作，记得与我微信联系哦！！！zx86250268;