module.exports.AnalyClass = AnalyClass;
const { fetchClassWithT, stringAt, pair } = require('./util');
const splitLine = '\r\n'.length;

String.prototype.clear = function () {
	return this.replace(/^[;\s\r\n]*|[\s\r\n]*$/g, '')
}

String.prototype.clearLine = function () {
	return this.replace(/\r\n|^[;\s\r\n]*|[\s\r\n]*$/g, '');
}

function AnalyClass(context) {
	context = context.clear();
	let obj = {
		context,
		tmpNote: null,
		tmpAnno: [],
		package: null,
		imports: {},
		class: null,
		T: [], //泛型列表
		exts: [], //继承的接口,继承一般只有一个，先以数组存着
		impl: [],
		anno: [],
		note: null,
		methods: [],
		fields: []
	}
	function clearTmp() {
		obj.tmpNote = null;
		obj.tmpAnno = [];
	}
	let step = 1000, iStep = 0;
	//解析,有几大类：注释、注解、函数、属性、导入包、包名、静态代码块
	while (obj.context.length > 0) {
		if (iStep == step) {
			// debugger;
			break;
		}
		iStep++;
		if (/^\/\//.test(obj.context)) {//注释
			obj.context = obj.context.substr(obj.context.indexOf('\r\n') + splitLine).clear(); continue;
		}
		if (/^\/\*/.test(obj.context)) {//注释
			pickNote.call(obj); continue;
		}
		if (/^package/.test(obj.context)) {//包名
			pickPackage.call(obj); continue;
		}
		if (/^import/.test(obj.context)) {//导入包
			pickImport.call(obj); continue;
		}
		if (obj.class == null && classPrefix.test(obj.context)) {//类定义
			pickClass.call(obj); clearTmp(); continue;
		}
		if (/^@/.test(obj.context)) {//注解
			pickAnno.call(obj); continue;
		}
		if (/^(static)?\s*\{/.test(obj.context)) {//静态代码块,忽略
			pickStatic.call(obj); clearTmp(); continue;
		}
		if (classPrefix.test(obj.context)) {//内部类,忽略
			pickNClass.call(obj); clearTmp(); continue;
		}
		if (/^[^\*=;\(]+\(/.test(obj.context)) {//函数
			pickMethod.call(obj); clearTmp(); continue;
		}
		if (/^[^\*=;\(]+[=;]/.test(obj.context)) {//属性
			pickField.call(obj); clearTmp(); continue;
		}
	}
	return obj;
}
/**获取变量名或者函数名 */
function fetchName(str) {
	return str.replace(/(^[^\(=;]*\s+(?=\w+))|([\(=;][\s\S]*$)/g, '');
}

function fetchType(str) {
	return /^public/.test(str) ? 'public' : (/^private/.test(str) ? 'private' : "protected");
}

function fetchReturn(str) {
	str = str.clearLine().replace(/^(public\s*|private\s*|final\s*|static\s*|abstract\s*)*/, '').clearLine();
	if (/^</.test(str)) {
		//有泛型,则删除泛型
		str = str.substr(pair(str).length).clearLine();
	}
	const [name, param] = fetchClassWithT(str);
	return name + (param == null ? "" : param);
}

//属性
function pickField() {
	const block = stringAt(this.context, [";"]).clearLine();
	const name = fetchName(block).clear();
	this.fields.push({
		openType: fetchType(block),//属性
		block,
		name,
		type: fetchReturn(block.split(new RegExp(`\s+${name}((\s*=)|$)`))[0]),
		anno: this.tmpAnno,
		note: this.tmpNote
	});
	this.context = this.context.substr(block.length + 1).clear();
}

function fetchParams(str) {
	str = str.clearLine().replace(/^\(|\)$/g, '').clearLine();
	let p = [];
	let o = {
		context: str,
		tmpAnno: []
	}
	//注解、类型、参数名
	while (o.context != '') {
		if (/^@/.test(o.context)) {
			pickAnno.call(o);
		} else {
			//类型+参数名
			const [type, params] = fetchClassWithT(o.context);
			let typeName = type + (params == null ? "" : params);
			let name = stringAt(o.context.substr(typeName.length), [',']);
			name = name || o.context.substr(typeName.length);
			o.context = o.context.substr(typeName.length + name.length).replace(/^[\s,]*|\s*$/g, '');
			p.push({
				name: name.clear(),
				type: typeName.clear(),
				anno: o.tmpAnno
			})
			o.tmpAnno = [];
		}
	}
	return p;
}


//函数
function pickMethod() {
	let block = stringAt(this.context, ["("]);
	block += pair(this.context.substr(block.length));
	this.context = this.context.substr(block.length).clear();
	const p = pair(this.context);
	this.context = this.context.substr(p.length).clear();
	const name = fetchName(block);
	if (name == this.class) return;//构造函数
	block = block.clearLine();
	//获取入参(@Vaild @ResponseBody Map<String, String> a,String b)

	this.methods.push({
		block,
		name,
		params: fetchParams(pair(block.substr(block.indexOf(name) + name.length))),//去除throw后面的内容
		type: fetchReturn(block.split(name)[0]),
		openType: fetchType(block),//属性
		anno: this.tmpAnno,
		note: this.tmpNote
	});
}



//内部类代码块
function pickNClass() {
	const block = stringAt(this.context, ["{"]);
	const p = pair(this.context.substr(block.length));
	this.context = this.context.substr(block.length + p.length).clear();
}

//静态代码块
function pickStatic() {
	const info = this.context.replace(/^static\s*/g, '');
	const t = pair(info);
	this.context = this.context.substr(info.length + t.length).clear();
}


//注解
function pickAnno() {
	let anno, param;
	if (/^@[a-zA-Z0-9]+\(/.test(this.context)) {
		[anno, param] = fetchClassWithT(this.context, '(');
	} else {
		anno = stringAt(this.context, ['@', '\r\n', ' ']);
	}
	this.tmpAnno.push(anno + (param != null ? param : ""));
	this.context = this.context.substr(anno.length + (param == null ? 0 : param.length)).clear();
}

//类定义解析
const classPrefix = /^(public\s+)?(final\s+)?(abstract\s+)?class[^\*\{]+{/;

function pickClass() {
	const idx = this.context.indexOf('{')
	let clzz = this.context.substr(0, idx).clearLine();
	this.context = this.context.substr(idx + 1).replace(/\}$/g, '').clear();
	//去除头部的修饰,如public final abstract class
	clzz = clzz.split('class')[1].clear();
	//此处有很多种情况,暂时只考虑className<T,B> 未解析className<T extends User>这种类型
	//clzz 有可能的类型 className<T, B extends User> extends class2 implements interface1
	const [className, tT] = fetchClassWithT(clzz);
	this.class = className;
	tT && tT.replace(/^<|>$/g, '').split(',').forEach(key => {
		const type = key.trim().split(' ').shift();
		this.T.push(type);
		this.imports[type] = type;
	})
	clzz = clzz.substr(className.length + (tT == null ? 0 : tT.length)).clear();
	let tmpClz, tType;
	//解析继承
	if (/^extends/.test(clzz)) {
		clzz = clzz.replace(/^extends\s+/g, '');
		while (true) {
			[tmpClz, tType] = fetchClassWithT(clzz);
			if (tmpClz == 'implements') {
				break;
			}
			this.exts.push(tmpClz + (tType || ""));
			clzz = clzz.substr(tmpClz.length + (tType == null ? 0 : tType.length)).clearLine();
			if (clzz == '' || /^implements/.test(clzz)) break;
		}
	}
	//解析接口
	if (/^implements/.test(clzz)) {
		clzz = clzz.replace(/^implements\s+/g, '');
		while (true) {
			[tmpClz, tType] = fetchClassWithT(clzz);
			this.impl.push(tmpClz + (tType || ""));
			clzz = clzz.substr(tmpClz.length + (tType == null ? 0 : tType.length)).clearLine();
			if (clzz == '') break;
		}
	}

	this.anno = this.tmpAnno;
	this.note = this.tmpNote;
}



/**提取导入的包 */
function pickImport() {
	const idx = this.context.indexOf(';')
	const importName = this.context.substr(0, idx).clearLine();
	const name = importName.replace(/^[\s\S]+\.|;$/g, '');
	if (name == '*') {
		this.imports[name] = this.imports[name] || [];
		this.imports[name].push(importName.replace(/^import\s*|\*$/g, ''));
	} else {
		this.imports[name] = importName.replace(/^import\s*/g, '')
	}
	this.context = this.context.substr(idx + 1).clear();
}

/**提取包名 */
function pickPackage() {
	const idx = this.context.indexOf(';')
	const packName = this.context.substr(0, idx).clearLine();
	this.package = packName.replace(/^package\s*/g, '');
	this.context = this.context.substr(idx + 1).clear();
}
/**提取注释 */
function pickNote() {
	const idx = this.context.substr(2).indexOf('*/');
	this.tmpNote = this.context.substr(0, idx + splitLine + 2);
	this.context = this.context.substr(idx + splitLine + 2).clear();
}