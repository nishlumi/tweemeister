var accman;
//---各サイト情報(appinfoと同じ順番にする)
var g_appinfo;

/**
* 認証処理
* @param {Number} type サービスタイプ
* @param {JSON} siteinfo サイト・サービス情報
* @param {JSON} keys APIキー情報
*/
function startAuth(type,siteinfo){
	var def = $.Deferred();
	console.log("type=" +type);
	console.log("siteinfo=");
	//---jsOAuth用configオブジェクト
	var config = {
		name : siteinfo.name,
		consumerKey : siteinfo.key,
		consumerSecret : siteinfo.secret,
		requestTokenUrl : siteinfo.option["requestTokenUrl"],
		authorizationUrl : siteinfo.option["authorizationUrl"],
		accessTokenUrl : siteinfo.option["accessTokenUrl"]
	};
	var oauth = OAuth(config);
	if (type == 0) { //---Twitter
		console.log(oauth);
		//---request token
		oauth.fetchRequestToken(function(data){
			console.log("requesttoken result="+ data);
			//パスの解析
			var path = document.createElement("a");
			path.href = data;
			var prm = path.search.replace("?","").split("&");
			//generate url for oauth_token
			var url = config["authorizationUrl"] + "?" + prm[0]; 
			
			def.resolve("3", oauth, config, url);
			//---authentication
			////AuthLaunchAuthorization("3", oauth, config, url);
			/*chrome.identity.launchWebAuthFlow({"url":url,"interactive":true},function(url){
				$.messager.prompt(_T("appName"),_T("auth_aft_mes01"),Auth3legged);
			});*/
		},function(data){
			def.reject(data);
			console.log("requesttoken error="+data);
		});
	}else if (type == 1){ //---Croudia
		//generate url for oauth_token
		var url = config["authorizationUrl"] + "?" + "response_type=code&client_id=" + 	config["consumerKey"];
		//console.log("type01 url=" + url);
		def.resolve("2", oauth, config, url);
		////AuthLaunchAuthorization("2", oauth, config, url);
		/*chrome.identity.launchWebAuthFlow({"url":url,"interactive":true},function(url){
			$.messager.prompt(_T("appName"),_T("auth_aft_mes01"),Auth2legged);
		});*/
	}
	return def.promise();
}
/**
* 各SNSサービスへの実際のログイン認証処理
* @param {Enum} type 認証手順タイプ (3 - 3leggd, 2 - 2legged)
* @param {jsOAuth} oauth jsOAuthオブジェクト
* @param {JSON} config jsOAuth用configオブジェクト
* @param {String} url 接続先URL
*/
function AuthLaunchAuthorization(type, oauth, config, url){
	var def = $.Deferred();
	chrome.identity.launchWebAuthFlow({"url":url,"interactive":true},function(url){
		if (type == "2") {
			var path = document.createElement("a");
			path.href = url;
			var prm = path.search.replace("?","").split("&");
			var prm_code = prm[0].split("=");
			//console.log(prm_code);
			if (chrome.runtime.lastError) {
				def.reject();
			}else{
				def.resolve(type,oauth,config,prm_code[1]);
			}
		}else{
			$.messager.prompt(_T("appName"),_T("auth_aft_mes01"),function(inp){
				if (inp) {
					def.resolve(type,oauth,config,inp);
				}else{
					def.reject();
					////$.messager.alert(_T("appName"),"コードが入力されていません。最初からやり直してください。","error");
				}
			});
		}
	});
	return def.promise();
}

/**
* 認証最終処理（3手順パターン）
* @param {String} inp 取得した文字列
*/
function Auth3legged(oauth, config, inp){
	console.log("identity end=" + inp);
	oauth.setVerifier(inp);
	//---access token
	oauth.fetchAccessToken(function(data){
		//fetch: urlencode oauth_token=xxx&oauth_token_secret=xxx&user_id=xxxxx&screen_name=xxxxx
		console.log("success access token:");
		console.log(data);
		console.log(oauth.getAccessToken());
		var prm = String(data.text).split("&");
		var ac = new Account();
		ac["servicename"] = config.name;
		ac["accesstoken"] = oauth.getAccessTokenKey();
		ac["accesssecret"] = oauth.getAccessTokenSecret();
		console.log("prm=");
		for (var i = 0; i < prm.length; i++) {
			console.log("prm[" + i + "]=");
			console.log(prm[i]);
			if (prm[i].indexOf("user_id") > -1) {
				var v = prm[i].split("=");
				ac["accountid"] = v[1];
			}
			if (prm[i].indexOf("screen_name") > -1) {
				var v = prm[i].split("=");
				ac["accountname"] = v[1];
			}
		}
		//各サービス、追加情報取得
		var sns = new SNS(ac,config);
		sns.uri = siteinfo[config.name].baseurl;
		
		console.log(sns.config);
		//twitterの場合、verify_credentialsで追加情報取得
		if (config.name == "twitter") {
			var def = sns.command("account/verify_credentials.json","get",{});
			def.done(function(name,data){
				console.log("verify_credentials=");
				//console.log(data);
				var js = $.parseJSON(data.text);
				//console.log(js);
				accman.add(ac,js);
				//AccountManagerへ保存・storageへも保存
				console.log(accman.items.length);
				accman.save(true);
				//一覧へ追加
				addListBox(ac, js);
			})
			.fail(function(name,data){
				sns.checkError(data);
			});
		}
	},function(data){
		console.log("failed access token:");
		console.log(data);
	});

}
/**
* 認証最終処理（2手順パターン）
* @param {String} inp 取得した文字列
*/
function Auth2legged(oauth, config, inp){
	console.log("identity end=" + inp);
	console.log("accesstoken url=" + config["accessTokenUrl"]);
	//---access token
	if (config.name == "croudia") {
		oauth.request({
			method: "POST",
			url : config["accessTokenUrl"],
			data : {
				"grant_type" : "authorization_code",
				"client_id" : config["consumerKey"],
				"client_secret" : config["consumerSecret"],
				"code" : inp
			},
			success:function(data){
				//fetch: json {"access_token":"8e39b343674af68f6243f83aa993a9b5febda5f9f8ada228be9e2a7c08f997d7","token_type":"Bearer","expires_in":3600,"refresh_token":"094d8758b2424b903000de2162b25061357b9d479c514f656869e74c5029c279"}
				console.log("success access token:");
				var js = $.parseJSON(data.text);
				var ac = new Account();
				ac["servicename"] = config.name;
				ac["accesstoken"] = js["access_token"];
				ac["accesssecret"] = " ";
				ac["additional"] = {
					token_type : js["token_type"],
					expires_in : js["expires_in"],
					refresh_token : js["refresh_token"],
					fetched_date : new Date()
				}
				//croudiaの場合はユーザー情報取得のため初API呼び出し
				console.log("auth2=");
				var sns = new SNS(ac,config);
				sns.uri = siteinfo[config.name].baseurl;
				sns.headers["Authorization"] = js["token_type"] + " " + js["access_token"];
				sns.headers["Content-Type"] = "application/x-www-form-urlencoded";
				var def = sns.command("account/verify_credentials.json","get",{});
				def.then(function(name,data){
					console.log("verify_credentials=");
					//console.log(data);
					var js2 = $.parseJSON(data.text);
					ac["accountid"] = js2["id_str"];
					ac["accountname"] = js2["screen_name"];
					ac["accesstoken"] = sns.currentAccount["accesstoken"];
					ac["additional"] = sns.currentAccount["additional"];
					accman.add(ac,js2);
					//AccountManagerへ保存・storageへも保存
					accman.save(true);
					//一覧へ追加
					addListBox(ac, js2);
				},function(name,data){
					sns.checkError(data);
				});
			},
			failure:function(data){
				console.log("failed access token:");
				console.log(data);
			}
		});
	}
}
function btn_acc_clicked(e){
	console.log(e.target.id);
	console.log(chrome.identity.getRedirectURL("provider_cb"));
	
	//---選択ボタンから接続先サービスを確定
	// 0 - twitter, 1 - croudia
	e.target.disabled = "disabled";
	var num = parseInt(e.target.id.replace("btn_acc",""));
		var stname = sitenames[num];
		//console.log(num);
		//console.log(stname);
		//認証・接続開始
		var def = startAuth(num,siteinfo[stname]);
		def.then(AuthLaunchAuthorization)
		.done(function(type,oauth,config,inp){
			if (type == "3") {
				Auth3legged(oauth,config,inp);
			}else if (type == "2") {
				Auth2legged(oauth,config,inp);
			}
			e.target.disabled = "";
		})
		.fail(function(){
			$.messager.alert(_T("appName"),"コードが入力されていません。最初からやり直してください。","error");
			e.target.disabled = "";
		});
	//});
}
function menu_reloadInfo_clicked(){
	var row = $("#tbl_acc").datagrid("getSelected");
	var selinx = $("#tbl_acc").datagrid("getRowIndex",row);
	
	var ac = accman.get({"servicename":row.srvname, "accountname":row.accname});
	//$.messager.alert(_T("appName"),ac.accountname + "(" + ac.accountid + ")<br>" + ac["servicename"],"info");
	console.log("account=");
	//console.log(ac);

	var config = {
		name : siteinfo[ac.servicename].name,
		consumerKey : siteinfo[ac.servicename]["key"],
		consumerSecret : siteinfo[ac.servicename]["secret"],
		requestTokenUrl : siteinfo[ac.servicename].option["requestTokenUrl"],
		authorizationUrl : siteinfo[ac.servicename].option["authorizationUrl"],
		accessTokenUrl : siteinfo[ac.servicename].option["accessTokenUrl"]
	};
	//---SNSコマンド実行開始
	var sns = new SNS(ac,config);
	sns.uri = siteinfo[ac.servicename].baseurl;
	if (ac.servicename == "croudia") {
		sns.headers["Authorization"] = ac["additional"]["token_type"] + " " + ac["accesstoken"];
	}
	console.log(sns.config);
	var def = sns.command("account/verify_credentials.json","get",{});
	def.then(null, function (name, data){
		//---第一次エラー発生
		console.log("first error - 1");
		var def2 = sns.checkError(data,null,null);
		return def2.promise();
	})
	.then(null,function(needRefresh){
		//---第一次エラー続き
		console.log("first error - 2");
		var def3 = $.Deferred();
		if (needRefresh) {
			def3 = sns.doRefreshToken(function(currentAccount){
				//---ここに来るということは指定アカウントがrefresh tokenされたということなので
				//   Account Managerを保存する
				var inx = accman.getIndex({
					servicename : currentAccount.servicename,
					accountname : currentAccount.accountname
				});
				if (inx > -1) accman.items[inx] = currentAccount;
				console.log("accman.items index=");
				//console.log(inx);
				//console.log(accman.items[inx]);
				accman.save(true);
				console.log("first error - 2,success");
				//def3.reject();
			},
			null);
		}else{
			console.log("first error - 2,real fail");
			def3.reject();
		}
		//---強制的に次もrejectedの処理へ
		return def3.promise();
	})
	.then(null,function(data){
		//---第一次エラーの後始末
		console.log("first error - 3");
		//---コマンドを再実行(Croudiaの場合のみ)
		if (config.name == "croudia"){
			if (sns.isRefreshAccount) {
				sns.headers["Authorization"] = ac["additional"]["token_type"] + " " + ac["accesstoken"];
				console.log("command re-execute");
				return sns.reexecute();
				//sns.command(cmdname,"post",param).then(cmd_success);
			}
		}
		return $.Deferred().reject().promise();
	})
	//---コマンド成功時
	.then(function(name, data){
		var js = $.parseJSON(data.text);
		ac["accountid"] = js["id_str"];
		ac["accountname"] = js["screen_name"];
		//ac.rawdata = js;
		var key = {"servicename": config.name, "accountid": js["id_str"] };
		console.log("menu_reloadInfo_clicked=");
		//console.log(ac.rawdata);
		//console.log(ac);
		var inx = accman.getIndex(key);
		accman.items[inx] = ac;
		accman.rawdatas[inx] = js;
		//AccountManagerへ保存・storageへも保存
		accman.save(true);
		setListBox(selinx, ac, js);
	},null);
}
function menu_Remove_clicked(){
	var row = $("#tbl_acc").datagrid("getSelected");
	var rowinx = $("#tbl_acc").datagrid("getRowIndex",row);
	var ac = accman.get({"servicename":row.srvname, "accountname":row.accname});
	console.log("account=");
	//console.log(ac);
	//sitenamesから添字逆引き、appinfoの対象を確定
	var apix = 0;
	for (var i = 0; i < sitenames.length; i++){
		if (ac.servicename == sitenames[i]) {
			apix = i;
		}
	}
	$.messager.confirm(_T("appName"),_T("remove_account_mes01"),function(ret){
		if (ret){
			accman.delete({
				"servicename" : row.srvname,
				"accountname" : row.accname
			});
			accman.save(true);
			$("#tbl_acc").datagrid("deleteRow",rowinx);
		}
	});
}
function setListBox(i, acc, rawdata){
	$("#tbl_acc").datagrid("updateRow",{
		index : i,
		row : {
			accname: acc.accountname, 
			srvname : acc.servicename,
			usrname : (rawdata["name"] ? rawdata["name"] : ""),
			cnt_status : (rawdata["statuses_count"] ? rawdata["statuses_count"] : ""),
			cnt_friend : (rawdata["friends_count"] ? rawdata["friends_count"] : ""),
			cnt_follow : (rawdata["followers_count"] ? rawdata["followers_count"] : "")
		}
	});

}
function addListBox(acc,rawdata){
	$("#tbl_acc").datagrid("appendRow",{
		accname: acc.accountname, 
		srvname : acc.servicename,
		usrname : (rawdata["name"] ? rawdata["name"] : ""),
		cnt_status : (rawdata["statuses_count"] ? rawdata["statuses_count"] : ""),
		cnt_friend : (rawdata["friends_count"] ? rawdata["friends_count"] : ""),
		cnt_follow : (rawdata["followers_count"] ? rawdata["followers_count"] : "")

	});
}
function generateListBox(){
	var items = accman.items;
	console.log(items.length);
	for (var i = 0; i < items.length; i++) {
		var rawdata = accman.rawdatas[i];
		$("#tbl_acc").datagrid("appendRow",{
			accname: items[i].accountname, 
			srvname : items[i].servicename,
			usrname : (rawdata["name"] ? rawdata["name"] : ""),
			cnt_status : (rawdata["statuses_count"] ? rawdata["statuses_count"] : ""),
			cnt_friend : (rawdata["friends_count"] ? rawdata["friends_count"] : ""),
			cnt_follow : (rawdata["followers_count"] ? rawdata["followers_count"] : ""),
		});
	}
}
function datagrid_clickrow(rowindex, rowdata){
	var ac = accman.rawdatas[rowindex];
	if (ac["status"]) {
		console.log(twttr.txt.autoLink(ac.status.text));
		document.getElementById("box_lastpost").innerHTML = twttr.txt.autoLink(ac.status.text);
	}else{
		document.getElementById("box_lastpost").innerHTML = "";
	}
}
function datagrid_styler_alignForNumber(value, row, index){
	return "text-align:right;";
}
document.addEventListener("DOMContentLoaded", function() {
	//internationalization
	document.getElementById("lab_addAccount").innerHTML = _T("lab_addAccount");
	document.getElementById("lab_warnAccount").innerHTML = _T("lab_warnAccount");
	document.getElementById("lab_addedAccount").innerHTML = _T("lab_addedAccount");
	document.getElementById("lab_lastestPostBySelAccount").innerHTML = _T("lab_lastestPostBySelAccount");
	var cloc = chrome.runtime.getManifest()["current_locale"];
	var locstr = cloc.split("_")[0];
	if (chrome.runtime.getManifest()["current_locale"] == "eo") locstr = "en";
	var src = document.createElement("script");
	src.src = "scripts/easyui-lang-" + locstr + ".js";
	document.body.appendChild(src);
	
	//bind element
	document.getElementById("btn_acc00").addEventListener("click",btn_acc_clicked);
	document.getElementById("btn_acc01").addEventListener("click",btn_acc_clicked);
	$("#tbl_acc").datagrid({
		striped : true,
		pagination : true,
		autoRowHeight : false,
		singleSelect : true,
		fitClumns : false,
		columns : [[
			{field:'accname',title:_T("tbl_acc_accname"),width:100,hidden:false,sortable:true},
			{field:'usrname',title:_T("tbl_acc_usrname"),width:120,hidden:false,sortable:true},
			{field:'srvname',title:_T("tbl_acc_srvname"),width:90,hidden:false,sortable:true},
			{field:'cnt_status',title:_T("tbl_acc_status"),width:70,hidden:false,sortable:true,styler:datagrid_styler_alignForNumber},
			{field:'cnt_friend',title:_T("tbl_acc_friend"),width:70,hidden:false,sortable:true,styler:datagrid_styler_alignForNumber},
			{field:'cnt_follow',title:_T("tbl_acc_follow"),width:80,hidden:false,sortable:true,styler:datagrid_styler_alignForNumber},
		]],
		toolbar : [
			{
				text : _T("acc_toolbar_reload"),
				iconCls : "icon-reload",
				handler : menu_reloadInfo_clicked
			},
				/*{
				text : _T("acc_toolbar_edit"),
				iconCls : "icon-edit",
				handler : function (){$.messager.alert(_T("appName"),_T("acc_toolbar_edit"));}
			},*/
			{
				text : _T("acc_toolbar_remove"),
				iconCls : "icon-remove",
				handler : menu_Remove_clicked
			}

		],
		onClickRow : datagrid_clickrow,
		data : null
	});
	accman = new AccountManager();
	accman.load(generateListBox);
	console.log(chrome.app.window.current().id);
	//appinfo読み込み
	chrome.storage.sync.get("appinfo",function(items){
		g_appinfo = items["appinfo"];
	});
	//console.log(chrome.runtime.id);
	//console.log(chrome.identity.getRedirectURL(""));
	document.title = _T("mainwin_mn00");
}, false);