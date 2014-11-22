document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("btn1").addEventListener("click",function(e){
		console.log(vw1.contentWindow.document.title);
	});
}, false);