const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const {join,resolve} = require('path');

module.exports = function(){
  return {
    entry:{
      DoAnalyClass:join(__dirname,'./analyApi/DoAnalyClass.js'),
      DoAnalyController:join(__dirname,'./analyApi/DoAnalyController.js'),
      DoApi2Type:join(__dirname,'./api2Service/DoApi2Type.js'),
      DoDoc:join(__dirname,'./api2Service/DoDoc.js'),
      DoMock:join(__dirname,'./api2Service/DoMock.js')
    },
    output:{
      publicPath:"./",
	    path: join(__dirname , "./libs"),//打包后的文件存放的地方
	    filename: "js/[name].js"//打包后输出文件的文件名
    },
    externals: {
			fs: "fs",
      path: "path",
      '../conf':'conf',
      'mockjs':'mockjs',
      "ejs":"ejs",
      "allClass":"allClass",
      "classTools":"classTools",
      "mockCfg":"mockCfg"
		},
    plugins:[
			new CleanWebpackPlugin(['libs'],{
				root:resolve(__dirname,'./js'),
				verbose:true
			}),
			new webpack.BannerPlugin('zengxiao版权所有，翻版必究')
	  ]
  }
}