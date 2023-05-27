// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
String.prototype.startWith=function(str){    
  var reg=new RegExp("^"+str);    
  return reg.test(this);       
} 
function initGlobalProps(message){
  var obj = {};
  obj.isSwitchCreated = false;
  obj.accountIndex = 0;
  if (message) {
    obj.isCommentByKeyword = message.data.isCommentByKeyword;
  }
  return obj;
}
const url_login = 'https://accounts.google.com/signin/v2/identifier?passive=false&uilel=0&hl=en&hl=en&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Fnext%3D%2F&action_handle_signin=true&app=desktop&service=youtube&flowName=GlifWebSignIn&flowEntry=AddSession&cid=1&navigationDirection=forward'
var globalProps = initGlobalProps();



function onCommented(message){
  chrome.storage.local.set({'isInstant': false});
  chrome.storage.local.get('watchurls',function(result_urls){
    var urls = result_urls.watchurls;
    if(urls.length == 1){
      return;
    }
    urls.splice(0,1);
    chrome.storage.local.set({ 'watchurls': urls});
    chrome.storage.local.get('tabid',function(result_tabid){
      if (globalProps.isCommentByKeyword) {
        chrome.tabs.update(result_tabid.tabid,{url:'https://www.youtube.com' + urls[0]}
        ,function(tab){
          console.log("updated tab = " + tab.id);
        });
      } else {
        chrome.tabs.update(result_tabid.tabid,{url: urls[0]}
        ,function(tab){
          console.log("updated tab = " + tab.id);
        });
      }
      
    });
  });
}
function onGeturl(message){
  chrome.storage.local.get('watchurls',function(result_watchurls){
    var mergedurls = result_watchurls.watchurls.concat(message.urls);
    console.log(mergedurls);
    chrome.storage.local.set({'watchurls': mergedurls});
  });
  chrome.storage.local.get('searchurls',function(result_urls){
    var urls = result_urls.searchurls;
    if(urls.length == 1){
      //start watching vedios
      chrome.storage.local.set({ 'status':'working'});
      chrome.storage.local.get('tabid',function(result_tabid){
        chrome.storage.local.get('watchurls',function(result_searchurls){
          chrome.tabs.update(result_tabid.tabid,{url:'https://www.youtube.com' + result_searchurls.watchurls[0]}
          ,function(tab){
          });
        });
      });
      return;
    }
    urls.splice(0,1);
    chrome.storage.local.set({ 'searchurls': urls});
    chrome.storage.local.get('tabid',function(result_tabid){
      chrome.tabs.update(result_tabid.tabid,{url:urls[0]}
      ,function(tab){
        console.log("updated tab = " + tab.id);
      });
    });
  });
}

function storeCommentInfo(message){
  chrome.storage.local.set({'searchurls':message.data.urls});
  chrome.storage.local.set({'watchurls': []});
  chrome.storage.local.set({'comment':message.data.comment});
  chrome.storage.local.set({'comments':message.data.comments});
  chrome.storage.local.set({'isInstant':message.data.isInstant});
  chrome.storage.local.set({'min':message.data.min});
  chrome.storage.local.set({'max':message.data.max});
  chrome.storage.local.set({'comment_cnt':message.data.comment_cnt});
  globalProps.accounts = message.data.accounts;
}

function doSwitchAccount(){
  console.log("doSwitchAccount");
  if(globalProps.swichTabid){
    chrome.tabs.update(globalProps.swichTabid,{url : url_login}, function(tab){ });
  }else{
    chrome.tabs.create({windowId: window.id, url: ""}, function(tab){
      console.log("created new switch tab = " + tab.id);
      globalProps.swichTabid = tab.id;
    });
  }
  setTimeout(function(){ doSwitchAccount()}, 30000);
}

function createNewWindow(message){
  globalProps = initGlobalProps(message);
  chrome.storage.local.set({'isInstant': true});
  chrome.storage.local.set({'status':'retriveurls'});
  storeCommentInfo(message);
  chrome.windows.create({url:"",state:"maximized"},function(window){
    globalProps.curWindow = window;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.storage.local.set({ 'tabid':tabs[0].id});
      if(message.data.isCommentByKeyword) {
        chrome.tabs.update(tabs[0].id,{url:message.data.urls[0]}
          ,function(tab){
            globalProps.watchTabId = tab.id;
            console.log("created new tab = " + tab.id);
          });
      } else {
        chrome.storage.local.set({'watchurls': message.data.urls});
        chrome.storage.local.set({ 'status':'working'});
        chrome.tabs.update(tabs[0].id,{url: message.data.urls[0]}
          ,function(tab){
            globalProps.watchTabId = tab.id;
            console.log("updated tab = " + tab.id);
        });
      }
    });
    
    if(globalProps.accounts.length > 0){
      console.log(globalProps.accounts)
      setTimeout(function(){ doSwitchAccount()}, 45000);
    }
  });
}



chrome.runtime.onMessage.addListener(function(message, sender) {
  if(message.commented){
    console.log('one commente done.');
  }
  else if(message.type){
    if(message.type == 'commented'){
      onCommented(message);
    }else if(message.type == 'geturl'){
      onGeturl(message);
    }
  }else if(message.data){
    createNewWindow(message);
  }
});

chrome.windows.onCreated.addListener(function(window){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if(globalProps.watchTabId){
        chrome.tabs.sendMessage(globalProps.watchTabId,'start to get urls.');
      }
    });
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if(changeInfo.status == 'complete'){
      if(globalProps.watchTabId == tabId){
        chrome.storage.local.get('status',function(result_status){
          console.log(result_status.status);
          if(result_status.status == 'working'){ 
              chrome.tabs.sendMessage(tabId,'start to comment.');
          }else if(result_status.status == 'retriveurls'){
            chrome.tabs.sendMessage(tabId,'start to get urls.');
          }
        });
      }else if(globalProps.swichTabid == tabId){
        console.log("globalProps.isSwitchCreated="+globalProps.isSwitchCreated);
        if(globalProps.isSwitchCreated){
          console.log("switchTabId=" + globalProps.swichTabid + '\turl=' + tab.url);
          chrome.storage.local.get('status',function(result_status){
          });
          if(tab.url.startWith('https://accounts.google.com/signin/v2/identifier')){
            var message = globalProps.accounts[globalProps.accountIndex];
            console.log(message)
            message.op = "select";
            chrome.tabs.sendMessage(tabId, message); 
            globalProps.accountIndex = (globalProps.accountIndex + 1) % globalProps.accounts.length;
          }
        }else{
          globalProps.isSwitchCreated = true;
          chrome.tabs.update(globalProps.swichTabid,{url : url_login}
            ,function(tab){  
            });
        }
      }
    }
});
