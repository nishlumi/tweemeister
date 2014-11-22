"use strict";
var g_appinfo;
var drgsrc = null;
var $select;
var accman;
var accbox;
var acclimits = [];
var attaches = null;
var isOverCharacter = [];

//=============アカウントボタン押下処理
function menu_add_clicked(){
	chrome.app.window.create("accdlg.html",{
		id : "accdlg",
		bounds : {
			width : 640,
			height : 480
		},
		minWidth : 640,
		minHeight: 480,
		maxWidth : 1024,
		maxHeight : 768
	},function(win){
		console.log(win.id);
		win.onClosed.addListener(function(){
			console.log("accdlg closed");
			console.log(win.id);
			//---念のためアカウントマネージャーとUIをリロード
			accman.load(generateControl);
		});
	});
	
}
//=============添付画像をクリアボタン押下処理
function btn_clear_img_clicked(e){
	if (document.getElementById("area_view_img").children.length > 0)
		document.getElementById("area_view_img").children[0].remove();
	attaches = null;
	document.getElementById("txt_contentlength_added").innerText = "";
}
//=============入力ボックスキー押し上げ処理
function count_inputcontent(targettext,taglen,addlen){
	if (addlen == null) addlen = parseInt(document.getElementById("txt_contentlength_added").innerText)
	if (isNaN(addlen)) addlen = 0;
	if (taglen == null) taglen = parseInt($("#txt_addtag").select2("val").join(" ").length);
	if (isNaN(taglen)) taglen = 0;
	var len = twttr.txt.getTweetLength(targettext); //String(e.target.innerText).length;
	document.getElementById("txt_contentlength").innerText = String(len + taglen + (taglen > 0 ? 1 : 0)); //1はスペース分
	document.getElementById("txt_contentlength_croudia").innerText = String(String(targettext).length + taglen + (taglen > 0 ? 1 : 0));
	for (var obj in acclimits) {
		if ((len+addlen+taglen+1) > acclimits[obj]) {
			$.jGrowl(obj + ":" + acclimits[obj] + _T("msg_over_limit"));
			isOverCharacter[obj] = true;
		}else{
			isOverCharacter[obj] = false;
		}
	}

}
function fr_inputcontent_keyup(e){
	count_inputcontent(e.target.innerText,null,null);
}
//=============送信ボタン押下処理
function btn_send_clicked(){
	//---ハッシュタグ分追加
	var tagarr = $("#txt_addtag").select2("val");
	var text = fr_inputcontent.document.body.innerText;
	if (tagarr instanceof Array) text += " " + $("#txt_addtag").select2("val").join(" ");
	//console.log(text);
	//---画像添付判定
	var isAttach = (attaches ? true : false);
	//---投稿するアカウント確定
	var acs = getSelectedAccounts();
	if (acs.length == 0) {
		$.messager.alert(_T("appName"),_T("post_error_msg01"),"warn");
		return;
	}
	var param = {};
	changeState_Buttons(false);
	for (var obj in acs){
		var servicename = acs[obj].servicename;
		//当該アカウントのSNSで文字数制限を超えていたらエラーを出してスキップ
		//if (siteinfo[servicename].name == "twitter"){
		if (isOverCharacter[siteinfo[servicename].name]) {
			$.messager.alert(_T("appName"),_T("post_error_msg02") + " - " + servicename,"error");
			continue;
		}
		//}
		param["status"] = text;
		
		var config = {
			name : siteinfo[servicename].name,
			consumerKey : siteinfo[servicename]["key"],
			consumerSecret : siteinfo[servicename]["secret"],
			requestTokenUrl : siteinfo[servicename].option["requestTokenUrl"],
			authorizationUrl : siteinfo[servicename].option["authorizationUrl"],
			accessTokenUrl : siteinfo[servicename].option["accessTokenUrl"]
		};
		if (servicename == "croudia") console.log("refresh_token="+acs[obj]["additional"]["refresh_token"]);
		var sns = new SNS(acs[obj],config);
		sns.uri = siteinfo[config.name].baseurl;
		var cmdname = "";
		if (config.name == "croudia"){
			sns.headers["Authorization"] = acs[obj]["additional"]["token_type"] + " " + acs[obj]["accesstoken"];
			if (isAttach){
				cmdname = "statuses/update_with_media.json";
				param["media"] = attaches;
			}else{
				cmdname = "statuses/update.json";
			}
		}else{
			if (isAttach){
				cmdname = "statuses/update_with_media.json";
				param["media[]"] = attaches;
			}else{
				cmdname = "statuses/update.json";
			}
		}
		//console.log(sns.config);
		var cmd_success = function(name, data){
			//console.log("statuses/update=");
			//console.log(data);
			//console.log("name=");
			//console.log(name);
			$.jGrowl(name  + ": " + _T("post_msg01"));
			if (document.getElementById("opt_clearpost").checked) {
				btn_clear_clicked();
				btn_clear_img_clicked();
			}
			changeState_Buttons(true);
		};
		var def = sns.command(cmdname,"post",param);
		def
		.then(null, function (name, data){
			changeState_Buttons(true);
			//---第一次エラー発生
			console.log("first error - 1: " + name);
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
					console.log(inx);
					console.log(accman.items[inx]);
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
					sns.headers["Authorization"] = acs[obj]["additional"]["token_type"] + " " + acs[obj]["accesstoken"];
					console.log("command re-execute");
					return sns.reexecute();
					//sns.command(cmdname,"post",param).then(cmd_success);
				}
			}
			return $.Deferred().reject().promise();
		})
		//---コマンド成功時処理はここで初めて登場、ここまででもエラーの場合は処理なし
		.then(cmd_success,null);
	}

}
//=============クリアボタン押下処理
function btn_clear_clicked(){
	var len = fr_inputcontent.document.body.innerText.length;
	var clen = parseInt(document.getElementById("txt_contentlength").innerText);
	var clen_cr = parseInt(document.getElementById("txt_contentlength_croudia").innerText);
	fr_inputcontent.document.execCommand("selectAll");
	fr_inputcontent.document.execCommand("delete");
	count_inputcontent(fr_inputcontent.document.body.innerText,null,null);
}
//=============投稿文関連ボタン活性非活性処理
function changeState_Buttons(enable){
	var flag = "";
	if (enable){
		flag = "";
	}else{
		flag = "disabled";
	}
	document.getElementById("btn_send").disabled = flag;
	document.getElementById("btn_clear").disabled = flag;
}
function btn_addtag_clicked(){
	$.messager.alert(_T("appName"),document.getElementById("img01").width);
	return;
	//$.messager.alert(chrome.i18n.getMessage("appName"),document.getElementById("txt_file").value);
	chrome.system.storage.getInfo(function(info){
		var str = "";
		for (var obj in info){
			str += obj + "id=" + info[obj].id + "<br/>" + 
				obj + "name=" + info[obj].name + "<br/>" + 
				obj + "type=" + info[obj].type + "<br/>" + 
				obj + "capacity=" + (info[obj].capacity/1024/1024/1024) + "GB<br/>";
		}
		$.messager.alert(_T("appName"),str);
	});
}
//=============コントロール生成
function generateControl(){
	accbox[0].selectize.clearOptions();
	var accitems = accman.items;
	for (var i = 0; i < accitems.length; i++) {
		generateBody_accoutBox(accitems[i],accman.rawdatas[i]);
	}
}
//=============アカウントボックス生成
function generateBody_accoutBox(accitem,accrawdata){
	var imgtag = accitem.servicename == "croudia" ? "profile_image_url_https" : "profile_image_url";
	console.log(accitem.rawdata);
	var imgurl = accrawdata ? accrawdata[imgtag] : "";
	loadImage(imgurl)
	.then(function(data){
		//console.log("data=");
		//console.log(data);
		//console.log(accitem);
		accbox[0].selectize.addOption({
			text : accitem.accountname + " (" + accitem.servicename + ")",
			value : accitem.accountname + "-" + accitem.servicename,
			"servicename" : accitem.servicename,
			"profileimage": data
		});
	},function(data){
		//console.log("data=");
		//console.log(data);
		//console.log(accitem);
		accbox[0].selectize.addOption({
			text : accitem.accountname + " (" + accitem.servicename + ")",
			value : accitem.accountname + "-" + accitem.servicename,
			"servicename" : accitem.servicename,
			"profileimage": data
		});
	});

}
//=============特殊文字ボックス生成
function generateSpecialCharBox(){
	$("#sel01").combobox({
		groupField : "group",
		groupFormatter : function(group){
			return "<span style='color:red;'>" + group + "</span>";
		},
		onSelect : function(record){
			generateSelectedCharList(record["value"]);
		}
	});
	var ln = 0;
	var optarr = [];
	//---文字タイプコンボボックス生成
	for (var i = 0; i < charlistEnum.length; i++) {
		optarr.push({text : charlistEnum[i].text, value : i, group : charlistEnum[i].group});
	}
	$("#sel01").combobox("loadData",optarr);
	generateSelectedCharList(0);

}
//=============特殊文字ボックス生成本体
function generateSelectedCharList(sel){
	var rec = charlistEnum[sel];
	if (!rec) return;
	var chcnt = document.getElementById("chararea").childElementCount;
	for (var i = chcnt-1; i >= 0; i--) {
		document.getElementById("chararea").children[i].remove();
	}
	document.getElementById("chararea").children
	var ln = 0;
	for (var i = rec.start; i < rec.end; i = i + 0x1) {
		var btn = document.createElement("button");
		btn.className = 'charbutton';
		if ((i >= 0x1DC0) && (i <= 0x1DFF)) {
			btn.innerHTML = "a&#" + i + ";";
		}else{
			btn.innerHTML = "&#" + i + ";";
		}
		btn.val = "&#" + i + ";";
		btn.title = "#" + i + ";";
		btn.onclick = function(){
			var a = this.val;
			document.getElementById("fr_inputcontent").contentWindow.focus();
			document.getElementById("fr_inputcontent").contentWindow.document.execCommand("insertHTML",false,a);
		}
		document.getElementById("chararea").appendChild(btn);
		ln++;
		if ((ln == 5) || (ln == 10)){
			var span = document.createElement("span");
			span.style.width = "2px";
			span.innerHTML = " ";
			document.getElementById("chararea").appendChild(span);
		}
		if (ln == 15) {
			//cont += "<br/>";
			var br = document.createElement("br");
			document.getElementById("chararea").appendChild(br);
			ln = 0;
		}
	}
}
//=============選択アカウント取得
function getSelectedAccounts(){
	var arr = $("#mn_accountbox").val();
	var ret = [];
	for (var obj in arr) {
		var val = accbox[0].selectize.options[arr[obj]]["value"].split("-");
		var opt = {
			"servicename" : accbox[0].selectize.options[arr[obj]]["servicename"],
			"accountname" : val[0]
		}
		ret.push(accman.get(opt));
	}
	return ret;
}
//=============アプリケーション設定読み込み
function loadAppSetting(){
	var mys = new MyStorage(false);
	mys.get(["opt_clearpost","opt_fontsize"])
	.then(function(items){
		for (var obj in items){
			if (obj == "opt_clearpost"){
				document.getElementById("opt_clearpost").checked = items[obj];
			}
			if (obj == "opt_fontsize"){
				$("#opt_fontsize").val(items[obj]);
				$(fr_inputcontent.document.body).css({
					"font-size" : $("#opt_fontsize").val() + "%"
				});

			}
		}
	});
	
}
//=============アプリケーション設定保存
function saveAppSetting(label,value){
	var mys = new MyStorage(false);
	var d = {};
	d[label] = value;
	mys.set(d,null);
	
}
//=============アンインストールボタン処理
function btn_uninstall_clicked(e){
	console.log(e.srcElement.id);
	if (e.srcElement.id == "btn_uninstall_s"){
		$.messager.confirm(_T("appName"),_T("msg_uninstall_sync"),function(res){
			if (res){
				console.log("delete sync data.");
				chrome.storage.sync.clear();
				$.messager.alert(_T("appName"),_T("msg_uninstall_after"),"info");
			}
		});
	}else if (e.srcElement.id == "btn_uninstall_l"){
		$.messager.confirm(_T("appName"),_T("msg_uninstall_local"),function(res){
			if (res){
				console.log("delete local data.");
				chrome.storage.local.clear();
				document.getElementById("pool_tag").innerHTML = "";
				$.messager.alert(_T("appName"),_T("msg_uninstall_after"),"info");
			}
		});
	}
}
document.addEventListener("DOMContentLoaded", function() {
	$("#mn0").linkbutton({
		iconCls : "icon-add",
		text : _T("mainwin_mn00")
	});
/**	$("#mn1").linkbutton({
		iconCls : "icon-edit",
		text : _T("mainwin_mn01")
	});*/
	$("#mn2").linkbutton({
		iconCls : "icon-help",
		text : "help"
	});
	$("#btn_clear_img").linkbutton({
		iconCls : "icon-remove",
		text : _T("btn_clear_img")
	});
	document.getElementById("mn0").addEventListener("click",menu_add_clicked);
//	document.getElementById("mn1").addEventListener("click",function(e){
		/*var f1 = function(){
			var def = $.Deferred();
			def.resolve("a");
			return def.promise();
		};
		f1().then(function(data){
			var def = $.Deferred();
			def.resolve(data+"s1");
			return def.promise();
		},function(data){
			var def = $.Deferred();
			def.reject(data+"e1");
			return def.promise();
		})
		.then(null,function(data){
			var def = $.Deferred();
			def.reject(data+"e2");
			return def.promise();
		})
		.then(function(data){
			var def = $.Deferred();
			def.resolve(data+"s3");
			return def.promise();
		},function(data){
			var def = $.Deferred();
			def.reject(data+"e3");
			return def.promise();
		})
		.done(function(data){
			console.log("done="+data);
		})
		.fail(function(data){
			console.log("fail="+data);
		});
		return;*/
/*		var url = "";
		url = "https://script.google.com/macros/s/AKfycbwP1-QvgcRqNMXGoFLurnegGAvetFT43fnG0cJO-eNqJl-tykE/exec";
		//url = "https://script.google.com/macros/s/AKfycbxX3CsLUCfbYxuP571d8ewyteUv3GWcdvz61oYt9RvaKC6UPo5G/exec";
		$.ajax(url,
		{
			type : "get",
			datatype : "text",
			data : {
				//p1 : "test",
				//p2 : "adb",
				//p3 : 100,
				dummy : "2014-03-12"
			},
			success : function(data, status, jqXHR){
				console.log("success is");
				console.log(data);
			},
			error : function ( jqXHR, textStatus, errorThrown ) {
				console.log("error is ");
				console.log(textStatus);
				console.log(errorThrown);
			}
		});
		return;
		$.jGrowl(_T("do_refresh_token_mes01"));
		console.log(fr_inputcontent.document.body.innerText + " " + $("#txt_addtag").select2("val").join(" "));
		return;
		console.log("accbox=");
		console.log($("#mn_accountbox").val());
		console.log(accbox[0].selectize.options[$("#mn_accountbox").val()[0]]["data-data"]);
		console.log(accbox[0].selectize);
		var win = $.messager.prompt(_T("appName"),"入力してください");
		
	});*/
	document.getElementById("mn2").addEventListener("click",function(e){
		$("#aboutdlg").dialog("open");
		return;
		var acs = getSelectedAccounts();
		for (var obj in acs) {
			var servicename = acs[obj].servicename;
			var config = {
				name : siteinfo[servicename].name,
				consumerKey : siteinfo[servicename]["key"],
				consumerSecret : siteinfo[servicename]["secret"],
				requestTokenUrl : siteinfo[servicename].option["requestTokenUrl"],
				authorizationUrl : siteinfo[servicename].option["authorizationUrl"],
				accessTokenUrl : siteinfo[servicename].option["accessTokenUrl"]
			};
			var sns = new SNS(acs[obj],config);
			sns.uri = siteinfo[config.name].baseurl;
			if (config.name == "croudia"){
				sns.headers["Authorization"] = acs[obj]["additional"]["token_type"] + " " + acs[obj]["accesstoken"];
			}
			console.log(sns.config);
			var cmdname = "statuses/user_timeline.json";
			var param = {
				screen_name : acs[obj].accountname,
				count : 2
			};
			console.log(param);
			var def = sns.command(cmdname,"get",param);
			def.then(function(data){
				var js = $.parseJSON(data.text);
				console.log(cmdname + "=");
				console.log(js);
			});
		}
	});
	document.getElementById("btn_clear_img").addEventListener("click",btn_clear_img_clicked);
	document.getElementById("btn_handspchar").addEventListener("click",function(e){
		var v = document.getElementById("inp_handspchar").value;
		if (v.indexOf("0x") > 0) {
			var a = "&#" + parseInt(document.getElementById("inp_handspchar").value) + ";";
		}else{
			var a = "&#" + parseInt(document.getElementById("inp_handspchar").value) + ";";
		}
		document.getElementById("fr_inputcontent").contentWindow.focus();
		document.getElementById("fr_inputcontent").contentWindow.document.execCommand("insertHTML",false,a);
	});
	var fontsize_data = [{text:"150%",value:"150"},{text:"100%",value:"100"},{text:"80%",value:"80"}];
	for (var obj in fontsize_data){
		var opt = document.createElement("option");
		opt.value = fontsize_data[obj]["value"];
		opt.innerHTML = fontsize_data[obj]["text"];
		if (fontsize_data[obj]["value"] == "100") opt.selected = true;
		document.getElementById("opt_fontsize").appendChild(opt);
	}
	
	document.getElementById("btn_send").addEventListener("click",btn_send_clicked);
	document.getElementById("btn_clear").addEventListener("click",btn_clear_clicked);
	document.getElementById("btn_uninstall_s").addEventListener("click",btn_uninstall_clicked);
	document.getElementById("btn_uninstall_l").addEventListener("click",btn_uninstall_clicked);
	document.getElementById("btn_reload_tagedit").addEventListener("click",function(e){
		$("#txt_addtag").select2({
		multiple : true,
		"tags" : $("#pool_tag").val().split("\n")
		});
		chrome.storage.local.set({"tags":$("#pool_tag").val()});
	});
	document.getElementById("opt_fontsize").addEventListener("change",function(e){
		$(fr_inputcontent.document.body).css({
			"font-size" : $("#opt_fontsize").val() + "%"
		});
	});
	$("#tab_area").tabs({});
	var tabs = $("#tab_area").tabs("tabs");
	//---titleに動的にセットしても国際化できないので、わざわざtabのupdateで行う
	for (var i = 0; i < tabs.length; i++) {
		$("#tab_area").tabs("update",{
			tab: tabs[i],
			options : {
				title : _T("mainwin_tab"+(i+1))
			}
		});
	}
	var tagarr;
	
	//---設定タブ内コントロールの初期化
	document.getElementById("opt_clearpost").addEventListener("click",function(e){
		//---設定は随時保存（パフォーマンス低下は懸念事項）
		saveAppSetting("opt_clearpost",document.getElementById("opt_clearpost").checked);
	});
	document.getElementById("opt_fontsize").addEventListener("change",function(e){
		saveAppSetting("opt_fontsize",$("#opt_fontsize").val());
	});
	//---設定復元
	loadAppSetting();
	var mys = new MyStorage(false);
	mys.get("tags")
	.then(function(data){
		$("#pool_tag").val(data["tags"]);
		if (data["tags"]) {
			var arr = data["tags"].split("\n");
		}else{
			var arr = [];
		}
		$("#txt_addtag").select2({
			multiple : true,
			"tags" : arr
		}).on("change",function(e){
			//var len = parseInt(document.getElementById("txt_contentlength").innerText);
			//var bodylen = parseInt(fr_inputcontent.document.body.innerText.length);
			//---タグ分の文字数取得
			var taglen = e.val.join(" ").length;
			count_inputcontent(fr_inputcontent.document.body.innerText,taglen,null)
			//document.getElementById("txt_contentlength").innerText = bodylen + taglen + (e.val.length > 0 ? 1 : 0);
			//console.log(e);
		});
	});
	$("#mn_accountbox").attr("placeHolder",_T("mn_accountbox_placeHolder"));
	accbox = $("#mn_accountbox").selectize({
		plugins : ["remove_button"],
		create : false,
		maxItems : 4,
		render : {
			option : function(item,escape){
				//console.log(item);
				return "<div>" +
					"<img src='" + item.profileimage + "' style='width:32px;height:32px;'/>" + 
					"<span>" + item.text + "</span>" +
					"</div>";
			}
		},
		onItemAdd : function (value, item){
			console.log(item);
			var arr = String(value).split("-");
			acclimits[arr[1]] = siteinfo[arr[1]].contentlimit;
			console.log(acclimits);
			$("#area_length_" + siteinfo[arr[1]].name).css({"display":"block"});
			if (siteinfo[arr[1]].name == "twitter"){
				if (attaches)
					document.getElementById("txt_contentlength_added").innerText = "+23";
			}
		},
		onItemRemove : function (value) {
			console.log(value);
			var arr = $("#mn_accountbox").val();
			acclimits = [];
			$(".area_length").css({"display":"none"});
			var containTwitter = false;
			for (var obj in arr) {
				var val = accbox[0].selectize.options[arr[obj]]["value"].split("-");
				if (val[1] == "twitter"){
					containTwitter = true;
				}
				$("#area_length_" + val[1]).css({"display":"block"});
				acclimits[val[1]] = siteinfo[val[1]].contentlimit;
			}
			if (!containTwitter) {
				document.getElementById("txt_contentlength_added").innerText = "";
			}
		}
	});
	//---国際化
	document.getElementById("btn_send").innerHTML = _T("mainwin_sendbtn");
	document.getElementById("btn_clear").innerHTML = _T("mainwin_clearbtn");
	document.getElementById("btn_reload_tagedit").innerHTML = _T("tagedit_reloadbtn");
	document.getElementById("lab_clearpost").innerHTML = _T("lab_clearpost");
	document.getElementById("lab_fontsize").innerHTML = _T("lab_fontsize");
	document.getElementById("txt_contentlength_added").title = _T("txt_contentlength_added");
	document.getElementById("lab_tab1_hashtag").innerHTML = _T("lab_tab1_hashtag");
	document.getElementById("lab_tab1_attach").innerHTML = _T("lab_tab1_attach");
	document.getElementById("lab_tagedit").innerHTML = _T("lab_tagedit");
	document.getElementById("btn_handspchar").innerHTML = _T("btn_handspchar");
	document.getElementById("inp_handspchar").title = _T("inp_handspchar_title");
	var cloc = chrome.runtime.getManifest()["current_locale"];
	var locstr = cloc.split("_")[0];
	if (cloc == "eo") locstr = "eo";
	if (cloc == "ja") {
		locstr = "jp";
		document.getElementById("lnk_man").href = "https://docs.google.com/presentation/d/1z0iHaE1RBiG0VQSKE8Za7rvNmwzHHwSXOOHyztBeSgk/edit?usp=sharing";
	}else{
		document.getElementById("lnk_man").href = "https://docs.google.com/presentation/d/1XaeYx4gAIC6AcTeqLDQg8G5KeXmyfGFe--DCQmm9B_g/edit?usp=sharing";
	}
	var src = document.createElement("script");
	src.src = "scripts/easyui-lang-" + locstr + ".js";
	document.body.appendChild(src);
	var src2 = document.createElement("script");
	src2.src = "scripts/select2_locale_" + cloc.split("_")[0] + ".js";
	document.body.appendChild(src2);
	
	//---画像添付周り
	document.getElementById("area_imgdrp").addEventListener("dragover",function(e){
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	},false);
	
	document.getElementById("area_imgdrp").addEventListener("drop",function(e){
		e.stopPropagation();
		e.preventDefault();
		var files = e.dataTransfer.files;
		if (files.length > 1) {
			$.messager.alert(_T("appName"),_T("image_error_msg01"),"error");
			return;
		}
		var acs = getSelectedAccounts();
		if (acs.length == 0) {
			$.messager.alert(_T("appName"),_T("post_error_msg01"),"warn");
			return;
		}
		var containTwitter = false;
		for (var obj in acs){
			if (acs[obj].servicename == "twitter"){
				containTwitter = true;
				break;
			}
		}
		for (var i = 0; i < files.length; i++) {
			attaches = files[i];
			//var len = parseInt(document.getElementById("txt_contentlength").innerText);
			if (containTwitter){
				document.getElementById("txt_contentlength_added").innerText = "+23";
			}
			console.log(files[i]);
			console.log(files[i].name + "/" + files[i].type);
			//return;
			var reader = new FileReader();
			reader.onload = (function(f){
				return function(e) {
					var img = document.createElement("img");
					var imgstr = "<img src='%1' alt='%2' title='%2' style='height:100px;'/>";
					img.src =  window.URL.createObjectURL(f);
					//console.log("e.target.result=" + e.target.result);
					//console.log(window.URL.createObjectURL(f));
					//img.style = "display:none;"; 
					img.id = "img01";
					img.alt = f.name;
					img.title = f.name;
					var span = document.createElement("span");
					span.innerHTML = imgstr.replace("%1",img.src).replace(/%2/g,f.name);
					//console.log(document.getElementById("area_view_img").children[0]);
					//document.getElementById("area_view_img").innerHTML = "";
					if (document.getElementById("area_view_img").children.length > 0)
						document.getElementById("area_view_img").children[0].remove();
					document.getElementById("area_view_img").appendChild(span);
					//console.log(img);
					
					//console.log(img.width);
				}
			})(files[i]);
			reader.readAsDataURL(files[i]);
		}
		return false;
	},false);

	//--全windowクローズ
	chrome.app.window.get("main").onClosed.addListener(function(){
		var win = chrome.app.window.getAll();
		win.forEach(function (w) {
			w.close();
		});
	});
	//---入力ボックス有効化（contenteditable）
	fr_inputcontent.document.designMode = "on";
	$(fr_inputcontent.document.body).css({
		"margin-top" : 0,
		"margin-left" : 0,
		"border" : "1 solid gray",
		"height" : "70px",
		"font-size" : "100%",
		"overflow" : "auto"
	});
	fr_inputcontent.document.body.addEventListener("keydown",function(e){
		//console.log(e.keyCode);
		if ((e.keyCode == 13) && (e.ctrlKey||e.metaKey)) {
			btn_send_clicked();
		}
	});
	fr_inputcontent.document.body.addEventListener("keyup",fr_inputcontent_keyup);
	
	accman = new AccountManager();
	accman.load(generateControl);

	/*function getData(){
		var def = $.Deferred();
		var xhr = new XMLHttpRequest();
		xhr.open("GET","https://croudia.com/testimages/download/18967",true);
		xhr.responseType = "blob";
		xhr.onload = function(e){
			console.log(e);
			chrome.storage.local.set({"testimg":this.response});
			//document.getElementById("img01").src = window.URL.createObjectURL(this.response);
			def.resolve(window.URL.createObjectURL(this.response));
			console.log(document.getElementById("img01").src);
		}
		xhr.send();
		return def.promise();
	}
	var defp = getData();
	defp.then(function(data){
		console.log("data=");
		console.log(data);
		document.getElementById("img01").src = data;
	});*/
	
	/*$.ajax("https://pbs.twimg.com/profile_images/378800000404629717/f0ddd51007bf33ae791079161fc21e71_normal.png",
	{
		type : "GET",
		datatype : "blob",
		success : function(data, status, jqXHR){
			console.log(jqXHR);
			//document.getElementById("img01").src = window.URL.createObjectURL(data);
			var cv = document.getElementById("cv");
			var ctx = cv.getContext("2d");
			var imgdata = ctx.createImageData(64,64);
			imgdata.data = data;
			ctx.putImageData(imgdata,0,0);
		}
	});*/
	//---UTF-8絵文字タブ内生成
	generateSpecialCharBox();
	//appinfo読み込み
	chrome.storage.sync.get("appinfo",function(items){
		g_appinfo = items["appinfo"];
	});
	var manifest = chrome.runtime.getManifest();
	document.getElementById("about_appname").innerHTML = _T("appName");
	document.getElementById("about_locale").innerHTML = manifest["current_locale"];
	document.getElementById("about_ver").innerHTML = manifest["version"];
	document.getElementById("about_desc").innerHTML = _T("appDescription");
	document.getElementById("about_author").innerHTML = manifest["author"];
	$("#aboutdlg").dialog({
		title : "About this application",
		modal : true,
		closed : true
	});

	//---その他設定
	$.jGrowl.defaults.pool = 4;
}, false);
