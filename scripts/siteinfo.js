//----テスト用
var sitenames = ["twitter","croudia"];

var siteinfo = {
	"twitter" : {
		name : "twitter",
		baseurl : "https://api.twitter.com/1.1/",
		key : "",
		secret : "",
		contentlimit : 140,
		option : {
			"requestTokenUrl":"https://api.twitter.com/oauth/request_token",
			"authorizationUrl":"https://api.twitter.com/oauth/authorize",
			"accessTokenUrl":"https://api.twitter.com/oauth/access_token"
		}
	},
	"croudia" : {
		name : "croudia",
		baseurl : "https://api.croudia.com/",
		key : "",
		secret : "",
		contentlimit : 372,
		option : {
			"requestTokenUrl" : "",
			"authorizationUrl" : "https://api.croudia.com/oauth/authorize",
			"accessTokenUrl" : "https://api.croudia.com/oauth/token"
		}
	}
};