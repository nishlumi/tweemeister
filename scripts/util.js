//define of Utilities
//shortcut of i18n function
var _T = chrome.i18n.getMessage;
var ID = document.getElementById;

//defines of global variables


//UTF-8 Characters list
var charlistEnum = [
	//---for pictogram etc
	{text :_T('Dingbats'), group : _T("Pictogram"), start:0x2700, end:0x27BF},
	{text :_T('MiscellaneousSymbols'), group : _T("Pictogram"), start:0x2600, end:0x26FF},
	{text :_T('Arrows'), group : _T("Pictogram"), start:0x2190, end:0x21FF},
	{text :_T('MiscellaneousSymbolsandArrows'), group : _T("Pictogram"), start:0x2B00, end:0x2BFF},
	{text :_T('GeometricShapes'), group : _T("Pictogram"), start:0x25A0, end:0x25FF},
	{text :_T('CurrencySymbols'), group : _T("Pictogram"), start:0x20A0, end:0x20CF},
	{text :_T('GeneralPunctuation'), group : _T("Pictogram"), start:0x2000, end:0x206F},
	{text :_T('NumberForms'), group : _T("Pictogram"), start:0x2150, end:0x218F},
	{text :_T('MathematicalOperators'), group : _T("Pictogram"), start:0x2200, end:0x22FF},
	{text :_T('MiscellaneousTechnical'), group : _T("Pictogram"), start:0x2300, end:0x23FF},
	{text :_T('BlockElements'), group : _T("Pictogram"), start:0x2580, end:0x259F},
	{text :_T('BraillePatterns'), group : _T("Pictogram"), start:0x2800, end:0x28FF},
	{text :_T('LetterlikeSymbols'), group : _T("Pictogram"), start:0x2100, end:0x214F},
	{text :_T('SupplementalArrowsB'), group : _T("Pictogram"), start:0x2900, end:0x297F},
	{text :_T('DominoTiles'), group : _T("Pictogram"), start:0x1F030, end:0x1F09F},
	{text :_T('MiscellaneousMathematicalSymbolsB'), group : _T("Pictogram"), start:0x2980, end:0x29FF},
	{text :_T('CJKSymbolsandPunctuation'), group : _T("Pictogram"), start:0x3000, end:0x303F},
	{text :_T('EnclosedCJKLettersandMonths'), group : _T("Pictogram"), start:0x3200, end:0x32FF},
	{text :_T('CJKCompatibility'), group : _T("Pictogram"), start:0x3300, end:0x33FF},
	{text :_T('CJKCompatibilityForms'), group : _T("Pictogram"), start:0xFE30, end:0xFE4F},
	{text :_T('SupplementalMathematicalOperators'), group : _T("Pictogram"), start:0x2A00, end:0x2AFF},
	{text :_T('SupplementalPunctuation'), group : _T("Pictogram"), start:0x2E00, end:0x2E7F},
	{text :_T('CombiningDiacriticalMarksSupplement'), group : _T("Pictogram"), start:0x1DC0, end:0x1DFF},
	{text :_T('SpacingModifierLetters'), group : _T("Pictogram"), start:0x02B0, end:0x02FF},
	{text :_T('OpticalCharacterRecognition'), group : _T("Pictogram"), start:0x2440, end:0x245F},
	//---for Language
	{text :_T('BasicLatin'), group : _T("Letter"), start:0x1E00, end:0x1EFF},
	{text :_T('PhoneticExtentions'), group : _T("Letter"), start:0x1D00, end:0x1D8F},
	{text :_T('PhoneticExtentionsSupplement'), group : _T("Letter"), start:0x1D80, end:0x1DBF},
	{text :_T('LatinExtendedAdditional'), group : _T("Letter"), start:0x1E00, end:0x1EFF},
	{text :_T('Latin1Supplement'), group : _T("Letter"), start:0x0080, end:0x00FF},
	{text :_T('LatinExtendedA'), group : _T("Letter"), start:0x0100, end:0x017F},
	{text :_T('LatinExtendedB'), group : _T("Letter"), start:0x0180, end:0x024F},
	{text :_T('LatinExtendedC'), group : _T("Letter"), start:0x2C60, end:0x2C7F},
	{text :_T('LatinExtendedD'), group : _T("Letter"), start:0xA720, end:0xA7FF},
	{text :_T('GreekExtended'), group : _T("Letter"), start:0x1F00, end:0x1FFF},
	{text :_T('GreekandCoptic'), group : _T("Letter"), start:0x0370, end:0x03FF},
	{text :_T('CJKRadicalsSupplement'), group : _T("Letter"), start:0x2E80, end:0x2EFF},
	{text :_T('KangxiRadicals'), group : _T("Letter"), start:0x2F00, end:0x2FDF},
	{text :_T('YijingHexagramSymbols'), group : _T("Letter"), start:0x4DC0, end:0x4DFF},
	{text :_T('Bopomofo'), group : _T("Letter"), start:0x3100, end:0x312F},
	{text :_T('HangulCompatibilityJamo'), group : _T("Letter"), start:0x3130, end:0x318F},
	{text :_T('Kanbun'), group : _T("Letter"), start:0x3190, end:0x319F},
	{text :_T('Hebrew'), group : _T("Letter"), start:0x0590, end:0x05FF},
	{text :_T('ModifierToneLetters'), group : _T("Letter"), start:0xA700, end:0xA71F},
	{text :_T('HangulSyllables'), group : _T("Letter"), start:0xAC00, end:0xD7AF},
	{text :_T('Gurmukhi'), group : _T("Letter"), start:0x0A00, end:0x0A7F},
	{text :_T('Gujarati'), group : _T("Letter"), start:0x0A80, end:0x0AFF},
	{text :_T('Oriya'), group : _T("Letter"), start:0x0B00, end:0x0B7F},
	{text :_T('Tamil'), group : _T("Letter"), start:0x0B80, end:0x0BFF},
	{text :_T('Telugu'), group : _T("Letter"), start:0x0C00, end:0x0C7F},
	{text :_T('Kannada'), group : _T("Letter"), start:0x0C80, end:0x0CFF},
	{text :_T('Malayalam'), group : _T("Letter"), start:0x0D00, end:0x0D7F},
	{text :_T('Sinhara'), group : _T("Letter"), start:0x0D80, end:0x0DFF},
	{text :_T('Thai'), group : _T("Letter"), start:0x0E00, end:0x0E7F},
	{text :_T('Tibetan'), group : _T("Letter"), start:0x0F00, end:0x0FFF},
	{text :_T('Buginese'), group : _T("Letter"), start:0x1A00, end:0x1A1F},
	{text :_T('Balinese'), group : _T("Letter"), start:0x1B00, end:0x1B7F},
	{text :_T('Sundanese'), group : _T("Letter"), start:0x1B80, end:0x1BBF},
	{text :_T('Lepcha'), group : _T("Letter"), start:0x1C00, end:0x1C4F},
	{text :_T('Ol_Chiki'), group : _T("Letter"), start:0x1C50, end:0x1C7F},
	{text :_T('Glagolitic'), group : _T("Letter"), start:0x1C50, end:0x1C7F},
	{text :_T('Coptic'), group : _T("Letter"), start:0x2C80, end:0x2CFF},
	{text :_T('GeorgianSupplement'), group : _T("Letter"), start:0x2D00, end:0x2D2F},
	{text :_T('Ethiopic'), group : _T("Letter"), start:0x1200, end:0x137F},
	{text :_T('EthiopicSupplement'), group : _T("Letter"), start:0x1380, end:0x139F},
	{text :_T('EthiopicExtended'), group : _T("Letter"), start:0x2D80, end:0x2DDF},
	{text :_T('Nko'), group : _T("Letter"), start:0x07C0, end:0x07FF},
	{text :_T('Cherokee'), group : _T("Letter"), start:0x13A0, end:0x13FF},
	{text :_T('Runic'), group : _T("Letter"), start:0x16A0, end:0x16FF},
	{text :_T('Cyrillic'), group : _T("Letter"), start:0x0400, end:0x04FF},
	{text :_T('CyrillicSupplement'), group : _T("Letter"), start:0x0500, end:0x052F},
	{text :_T('Armenian'), group : _T("Letter"), start:0x0530, end:0x058F},
	{text :_T('Arabic'), group : _T("Letter"), start:0x0600, end:0x06FF},
	{text :_T('ArabicSupplement'), group : _T("Letter"), start:0x0750, end:0x077F},
	{text :_T('Syriac'), group : _T("Letter"), start:0x0700, end:0x074F},
	{text :_T('Thaana'), group : _T("Letter"), start:0x0780, end:0x07BF},
	{text :_T('Devanagari'), group : _T("Letter"), start:0x0900, end:0x097F},
	{text :_T('Bengali'), group : _T("Letter"), start:0x0980, end:0x09FF},
	{text :_T('Myanmar'), group : _T("Letter"), start:0x1000, end:0x109F},
	{text :_T('CanadianAboriginal'), group : _T("Letter"), start:0x1400, end:0x167F},
	{text :_T('Ogham'), group : _T("Letter"), start:0x1680, end:0x169F},
	{text :_T('Tagalog'), group : _T("Letter"), start:0x1700, end:0x171F},
	{text :_T('Hanunoo'), group : _T("Letter"), start:0x1720, end:0x173F},
	{text :_T('Buhid'), group : _T("Letter"), start:0x1740, end:0x175F},
	{text :_T('Tagbanwa'), group : _T("Letter"), start:0x1760, end:0x177F},
	{text :_T('Khmer'), group : _T("Letter"), start:0x1780, end:0x17FF},
	{text :_T('Mongolian'), group : _T("Letter"), start:0x1800, end:0x18AF},
	{text :_T('Limbu'), group : _T("Letter"), start:0x1900, end:0x194F},
	{text :_T('TaiLe'), group : _T("Letter"), start:0x1950, end:0x197F},
	{text :_T('NewTaiLue'), group : _T("Letter"), start:0x1980, end:0x19DF},

];


/**
* 画像を外部から取得
* @param {String} url 画像のURL
* @return {Deferred.Promise} DeferredのPromiseオブジェクト
* -> 呼び出したロジックでは.then(funtion(data){ ... })で処理を続けること。
*/
function loadImage(url){
	var def = $.Deferred();
	if (!url) return def.reject("").promise();
	var xhr = new XMLHttpRequest();
	xhr.open("GET",url,true);
	xhr.responseType = "blob";
	xhr.onload = function(e){
		//console.log(e);
		def.resolve(window.URL.createObjectURL(this.response));
	}
	xhr.send();
	return def.promise();
}
/**
* プレーンテキストをHTMLで適切な表示になるよう変換する
* @param {String} text 元のテキスト
* @return {String} 変換後のテキスト
*/
function convertText_ForHTML(text) {
	
}
var MyStorage = function(sync){
	var own = this;
	this.isSync = sync;
	this._getStorage = function(){
		if (own.isSync) {
			return chrome.storage.sync;
		}else{
			return chrome.storage.local;
		}
	}
	/**
	* StorageArea.getを実行する
	* @param {String} or {Array} keys ストレージのキー
	* @return {$.Deferred().Promise()} Promiseオブジェクト
	* -> 呼び出したロジックでは.then(funtion(items){ ... })で処理を続けること。
	*/
	this.get = function(keys){
		var def = $.Deferred();
		own._getStorage().get(keys,function(items){
			if (items){
				def.resolve(items);
			}else{
				def.reject();
			}
		});
		return def.promise();
	}
	this.set = function(data){
		var def = $.Deferred();
		own._getStorage().set(data,function(){
			if (chrome.runtime.lastError && chrome.runtime.lastError != "") {
				def.reject(chrome.runtime.lastError);
			}else{
				def.resolve(true);
			}
		});
		return def.promise();
	}
	this.remove = function(keys){
		var def = $.Deferred();
		own._getStorage().remove(keys,function(){
			if (chrome.runtime.lastError && chrome.runtime.lastError != "") {
				def.reject(chrome.runtime.lastError);
			}else{
				def.resolve(true);
			}
		});
		return def.promise();
	}
	this.clear = function(){
		var def = $.Deferred();
		own._getStorage().clear(function(){
			if (chrome.runtime.lastError && chrome.runtime.lastError != "") {
				def.reject(chrome.runtime.lastError);
			}else{
				def.resolve(true);
			}
		});
		return def.promise();
	}

}