
var Account = function(){
	this.servicename = "";
	this.accesstoken = "";
	this.accesssecret = "";
	this.accountid = "";
	this.accountname = "";
	this.additional = {};
	this.rawdata = {};
}
var AccountManager = function (){
	var own = this;
	this.items = [];
	this.rawdatas = [];
	/**
	add
	parameter:
		account = {
			servicename : "",
			accesstoken : "",
			accesssecret : "",
			accountid : "",
			accountname : "",
			additional : {},
		}
		raw = twitter/croudia's user objects
	*/
	this.add = function(account,raw){
		var ac = new Account();
		ac.servicename = account.servicename;
		ac.accesstoken = account.accesstoken;
		ac.accesssecret = account.accesssecret;
		ac.accountid = account.accountid;
		ac.accountname = account.accountname;
		ac.additional = account.additional;
		//ac.rawdata = account.rawdata;
		own.items.push(ac);
		own.rawdatas.push(raw);
	}
	/**
	get
	parameter:
		account = { いずれか、あるいは全て指定
			servicename : "",
			accountid : "",
			accountname : "",
		}
	*/
	this.getIndex = function (key){
		var keylen = 0;
		var ret = -1;
		for (var obj in key){
			keylen++;
		}
		for (var i = 0; i < own.items.length; i++) {
			var hit = 0;
			if (key["servicename"] && (key["servicename"] == own.items[i].servicename)) {
				hit++;
			}
			if (key["accountid"] && (key["accountid"] == own.items[i].accountid)) {
				hit++;
			}
			if (key["accountname"] && (key["accountname"] == own.items[i].accountname)) {
				hit++;
			}
			if (hit == keylen) {
				ret = i;
				break;
			}
		}
		return ret;
	}
	this.get = function(key){
		var i = own.getIndex(key);
		if (i > -1) {
			return own.items[i];
		}else{
			return null;
		}
	}
	this.getRawdata = function (key){
		var i = own.getIndex(key);
		if (i > -1) {
			return own.rawdatas[i];
		}else{
			return null;
		}
	}
	/**
	delete
		keys = {
			servicename : "",
			accountid : ""
		}
	*/
	this.delete = function(keys){
		var i = own.getIndex(keys);
		console.log(i);
		if (i > -1) {
			own.items.splice(i,1);
			own.rawdatas.splice(i,1);
			return true;
		}else{
			return false;
		}
	}
	this.save = function (issync){
		var db;
		if (issync){
			db = chrome.storage.sync;
		}else{
			db = chrome.storage.local;
		}
		//var a = new Account();
		//a = own.items;
		//---rawdata含めた全てはlocalへ保存
		function chkerr(){
			if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
		}
		chrome.storage.local.set({"accounts":own.rawdatas},chkerr);
		//---rawdataを除いた他全てはsyncへ保存
		db.set({"accounts":own.items},chkerr);
	}
	this.load = function(callback){
		own.items.splice(0,own.items.length);
		own.rawdatas.splice(0,own.rawdatas.length);
		//---syncから取得
		chrome.storage.sync.get("accounts",function(items){
			if (items["accounts"]) {
				own.items = items["accounts"];
				console.log("own.items=");
				console.log(own.items);
				//var acs = items["accounts"];
				//---localからrawdataを補完
				chrome.storage.local.get("accounts",function(items){
					if (items["accounts"]) {
						own.rawdatas = items["accounts"];
						console.log("own.rawdatas=");
						console.log(own.rawdatas);
					}
					if (callback) callback();
				});
			}
		});
	}
	//this.init();
}
/**
* SNSオブジェクト
* SNSの各APIを実行する
* @param {Account} account Accountオブジェクト
* @parma {JSON} config おもにjsOAuth用のオブジェクト
*/
var SNS = function(account,config){
	var own = this;
	//---Account object
	this.currentAccount = account;
	this.isRefreshAccount = false;
	this.lastCommandParam = {};
	/**
	* config
	* @param {String} name : "",
	* @param {String} consumerKey : "",
	* @param {String} consumerSecret : "",
	* @param {String} requestTokenUrl : "",
	* @param {String} authorizationUrl : "",
	* @param {String} accessTokenUrl : ""
	*/
	this.config = config;
	this.uri = "";	// http://www.com/ (/まで指定する)
	this.needRefreshToken = false;
	this.headers = {};
	/**
	* command - APIを実行
	* @param {String} cmdname API名
	* @param {String} method メソッド(GET, POST など)
	* @param {JSON} param 受け渡すパラメータ
	* @return {Deferred.Promise} DeferredのPromiseオブジェクト
	* -> 呼び出したロジックでは.then(funtion(data){ ... })で処理を続けること。
	*/
	this.command = function(cmdname,method,param){
		var def = $.Deferred();
		if (own.uri == "") return false;
		//if (!callback) return false;
		own.lastCommandParam["cmdname"] = cmdname;
		own.lastCommandParam["method"] = method;
		own.lastCommandParam["param"] = param;
		//own.lastCommandParam["callback"] = callback;
		//---generate url
		var url = own.uri + cmdname;
		var paramarr = [];
		var paramstr = "";
		
		for (var obj in param) {
			paramarr.push(obj + "=" + param[obj]);
		}
		paramstr = paramarr.join("&");
		if (method.toLowerCase() == "get") {
			if (paramstr != "") url += "?" + paramstr;
		}
		//---start connect
		if (own.currentAccount.servicename == "croudia"){
			var oauth = new OAuth(own.config);
			console.log("account=");
			console.log(own.currentAccount.accesstoken);
			console.log(own.currentAccount.accesssecret);
			oauth.setAccessToken(own.currentAccount.accesstoken," ");
			var hd = own.headers;
			oauth.request({
				method : method.toLowerCase(),
				url : url,
				data : (method.toLowerCase() == "get" ? {} : param),
				headers : hd,
				defaultoauth : "no",
				success : function(data){
						//---refresh token必要フラグ解除
						own.needRefreshToken = false;
						//callback(data);
						def.resolve(config.name,data);
					},
				failure : function(data){
						//own.checkError(data);
						def.reject(config.name,data);
					}
			});

		}else{
			var oauth = new OAuth(own.config);
			console.log("account=");
			console.log(own.currentAccount.accesstoken);
			console.log(own.currentAccount.accesssecret);
			oauth.setAccessToken(own.currentAccount.accesstoken,own.currentAccount.accesssecret);
			if (method.toLowerCase() == "get") {
				oauth.get(url,
					function(data){
						//---refresh token必要フラグ解除
						own.needRefreshToken = false;
						//callback(data);
						def.resolve(config.name,data);
					},
					function(data){
						//own.checkError(data);
						def.reject(config.name,data);
					});
			}else if (method.toLowerCase() == "post") {
				oauth.post(url,param,
					function(data){
						//---refresh token必要フラグ解除
						own.needRefreshToken = false;
						//callback(data);
						def.resolve(config.name,data);
					},
					function(data){
						//own.checkError(data);
						def.reject(config.name,data);
					});
			}
			
			/*
				success/failure戻り値の注意
				コールバックには次の内容が返される
				{
					text : "",
					xml : "",
					requestHeaders : {},
					responseHeaders : {}
					
				}
				json型では返されないので注意
			*/
		}
		return def.promise();
	}
	/**
	* コマンド再実行
	*/
	this.reexecute = function(){
		return own.command(own.lastCommandParam["cmdname"],own.lastCommandParam["method"],own.lastCommandParam["param"]);
	}
	/**
	* エラーチェック標準処理
	* @param {JSON} data jsOAuthで返されるリターンオブジェクト
	* @param {function} callback 成功時のコールバック関数
	* @param {function} failedcall 失敗時のコールバック関数
	*/
	this.checkError = function(data,callback,failedcall){
		var def = $.Deferred();
		var errmsg = "";
		console.log("error data=");
		console.log(data);
		var resheader = data.responseHeaders;
		if (own.config.name == "twitter"){
			var js = $.parseJSON(data.text);
			if (js){
				errmsg = js["errors"][0]["message"];
				errcd = js["errors"][0]["code"];
			}else{
				errmsg = data.text;
			}
			$.messager.alert(_T("appName"),errmsg,"error");
			def.reject(false);
		}else if (own.config.name == "croudia"){
			var js;
			var wwwa = resheader["WWW-Authenticate"];
			var stat = resheader["Status"];
			console.log("wwwa=" + wwwa);
			console.log("stat=" + stat);
			console.log(parseInt(stat));
			stat = parseInt(stat);
			if (isNaN(stat)) { //強制的に不明なエラー
				stat = 999;
			}
			if (stat == 400) {
				js = $.parseJSON(data.text);
				errmsg = js["error"];
			}
			if ((errmsg == "invalid_grant") || (stat == 401)) { //エラーがinvalid_grantの場合はとにかくrefresh token
				if (own.needRefreshToken) {
					//---すでに必要フラグがONの場合はエラー表示のみ
					//   次回正常終了するまで絶対refresh tokenはさせない
					$.messager.alert(_T("appName"),errmsg,"error");
					def.reject(false);
				}else{
					//---refresh tokenが必要フラグON
					own.needRefreshToken = true;
					console.log("enter doRefreshToken");
					//own.doRefreshToken(callback,failedcall);
					def.reject(own.needRefreshToken);
				}
			}else{
				$.messager.alert(_T("appName"),errmsg,"error");
				def.reject(false);
			}
		}
		return def;
	}
	this.checkRefreshToken = function(){
		
	}
	this.doRefreshToken = function(callback,failedcall){
		var def = $.Deferred();
		//---ループ回避
		//if (!own.needRefreshToken) return;
		var oauth = new OAuth(own.config);
		if (own.currentAccount.servicename == "croudia") {
			var d = {
				"grant_type" : "refresh_token",
				"client_id" : config["consumerKey"],
				"client_secret" : config["consumerSecret"],
				"refresh_token" : own.currentAccount.additional.refresh_token
			};
			console.log("d=");
			console.log(d);
			oauth.request({
				method: "POST",
				url : config["accessTokenUrl"],
				//headers : own.headers,
				data : d,
				success:function(data){
					//fetch: json {"access_token":"8e39b343674af68f6243f83aa993a9b5febda5f9f8ada228be9e2a7c08f997d7","token_type":"Bearer","expires_in":3600,"refresh_token":"094d8758b2424b903000de2162b25061357b9d479c514f656869e74c5029c279"}
					console.log("success access token:");
					console.log(data);
					var js = $.parseJSON(data.text);
					//var ac = new Account();
					//ac["servicename"] = own.config.name;
					//ac["accountid"] = own.currentAccount.accountid;
					//ac["accountname"] = own.currentAccount.accountname;
					own.currentAccount["accesstoken"] = js["access_token"];
					own.currentAccount["additional"] = {
						token_type : js["token_type"],
						expires_in : js["expires_in"],
						refresh_token : js["refresh_token"],
						fetched_date : new Date()
					};
					//own.currentAccount = ac;
					console.log("currentAccount=");
					console.log(own.currentAccount);
					own.isRefreshAccount = true;
					//refresh tokenしたことを通知
					$.jGrowl("croudia: " + _T("do_refresh_token_mes01"));
					//ここまできたということは一度はAPIが失敗しているということなので、再実行。
					//ただし、ループ回避のため、2度めはない
					//own.command(own.lastCommandParam.cmdname,own.lastCommandParam.method,
					//	own.lastCommandParam.param,own.lastCommandParam.callback
					//);
					if (callback) callback(own.currentAccount);
					def.reject();
				},
				failure:function(data){
					console.log("failed access token:");
					console.log(data);
					if (failedcall) failedcall(data);
					def.reject();
				}
			});
		}
		return def.promise();
	}

}