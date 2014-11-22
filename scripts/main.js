'use strict';

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function() {
    var width = 720;
    var height = 430;

    chrome.app.window.create('index.html', {
        id: 'main',
        bounds: {
            width: width,
            height: height,
            left: Math.round((screen.availWidth - width) / 2),
            top: Math.round((screen.availHeight - height)/2)
        },
		minWidth : width,
		minHeight: height,
		maxWidth : width + (width / 2),
		maxHeight : height + (height / 2)
    });

});
chrome.runtime.onInstalled.addListener(function(){
});
chrome.runtime.onSuspend.addListener(function(){
});
