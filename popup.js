// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function Popup() {
  this.start_btn = $("#start_btn"),
  this.dis_start_btn = $("#dis_start_btn"),
  this.comment = $("#comment"),
  this.keywords = $("#keywords"),
  this.commentCnt = $("#comment_cnt"),
  this.accountsText = $('#accounts'),
  this.min_play_time = $("#min_play_time"),
  this.max_play_time = $("#max_play_time"),
  this.Utils = EX.Utils,
  this.currentList = "0",
  this.comments = [];
  var t = this;
  this.comment.keyup(function(e) {
      t.enableClick()
  }),
  this.keywords.keyup(function(e) {
      t.enableClick()
  }),
  this.parseAccounts = function() {
    var input_text = this.accountsText.val();
    var lines = input_text.split('\n');
    var arr = new Array();
    if (lines.length > 0) {
        for (var i in lines) {
            var line  = lines[i];
            if (line == null || line == '')
                continue;
            var cols = line.split('|');
            arr.push({accountName: cols[0], password: cols[1]});
        }
    }
    return arr;
  }
}
function getSearchword(s){
    var arr = s.split(' ');
    var newword = "";
    arr.forEach(function( i) {
        if(newword == "")
            newword = i;
        else
            newword = newword + "+" + i;
    });
    return newword;
}
Popup.prototype.updateChartsNum = function() {
  var t = this.comment.val().length;
  t = this.maxLength - t;
},
Popup.prototype.updateStore = function() {
    var ks = this.keywords.val(),c = this.comment.val()
    ,cnt = this.commentCnt.val(),min = this.min_play_time.val()
    ,max = this.max_play_time.val(), accounts = this.accountsText.val();
    this.Utils.local().set({
        keywords: ks
    });
    this.Utils.local().set({
        comment:c
    });
    if(min){
        this.Utils.local().set({
            min:min
        });
    }
    if(max){
        this.Utils.local().set({
            max:max
        });
    }
    if(cnt){
        this.Utils.local().set({
            commentCnt:cnt
        });
    }
    this.Utils.local().set({
        accounts: accounts
    });
    var checkedval = $("input:radio[name='comment_keyword']:checked").val();
    this.Utils.local().set({
        checkedval: checkedval
    });
},
Popup.prototype.enableClick = function() {
  var t = this.keywords.val().length,
  e = this.comment.val().length;
  if (e > 0 && t > 0) return this.start_btn.show(),void this.dis_start_btn.hide();
  e > 0 && t > 0 ? (this.start_btn.show(), this.dis_start_btn.hide()) : (this.start_btn.hide(), this.dis_start_btn.show())
},
Popup.prototype.init = function() {
    var t = this;
    this.start_btn.click(function(e) {
      t.start()
    }),
  this.Utils.local().get(["keywords", "comment","commentCnt","min","max","checkedval", "accounts"],
  function(e) {
      t.comment.val(e.comment),
      t.keywords.val(e.keywords),
      t.enableClick(),
      t.updateChartsNum();
      if(e.commentCnt){
        t.commentCnt.val(e.commentCnt);
      }
      if(e.min){
        t.min_play_time.val(e.min);
      }
      if(e.max){
          t.max_play_time.val(e.max);
      }
      t.accountsText.val(e.accounts);
      if (e.checkedval == 'keyword') {
        $("input:radio[value='keyword']").trigger('click');
      } else if (e.checkedval == 'url') {
        $("input:radio[value='url']").trigger('click');
      } else {
        $("input:radio[value='search_url']").trigger('click');
      }
    }),
  setInterval(function() {
      t.updateStore()
  },
  500);
  $('input:radio[name="comment_keyword"]').click(function(){
	var checkValue = $('input:radio[name="comment_keyword"]:checked').val(); 
	if (checkValue == 'keyword') {
        $('#keywords').attr('placeholder','Input the keywords of your niche');
        $('#keywords').insertBefore('#rd2');
    } else if (checkValue == 'url') {
        $('#keywords').attr('placeholder','Input your url list');
        $('#keywords').insertBefore('#rd3')
    } else if (checkValue == 'search_url') {
        $('#keywords').attr('placeholder','Input your search url list');
        $('#keywords').insertAfter('#rd3')
    }
});
},
Popup.prototype.start = function() {
    console.log('start');
    var baseurl = 'https://www.youtube.com/results?search_query=';
    var t = this,
    e = this.keywords.val().split('\n');
    var isCommentByKeyword = $("input:radio[name=comment_keyword]")[0].checked;
    var isCommentBySearchUrl = $("input:radio[name=comment_keyword]")[2].checked;
    var isInstant = true;
    var min = $("#min_play_time").val(),max = $("#max_play_time").val(),comment_cnt = $("#comment_cnt").val();
    var parsedAccounts = this.parseAccounts();
    console.log(parsedAccounts);
    console.log('min=' + min + " max=" + max);

    var searchurls = [];
    if (isCommentByKeyword) {
        e.forEach(function( i) {
            searchurls.push(baseurl + getSearchword(i));
        });
    } else if (isCommentBySearchUrl) {
        e.forEach(function( i) {
            searchurls.push(i);
        });
        isCommentByKeyword = true;
    } else {
        e.forEach(function( i) {
            searchurls.push(i);
        });
    }
    var comments = this.comment.val().split('\n');
    EX.Utils.isStandard(function(f){
        var result = JSON.parse(f);
        if(result.standard == false){
            if(comment_cnt > 30)
                comment_cnt = 30;
            if(searchurls.length > 3){
                searchurls = searchurls.slice(0,3);
            }
            if(comments.length > 3){
                comments = comments.slice(0,3);
            }
        }
        t.Utils.sendMessage("URL", {
            comment: t.comment.val(),
            comments : comments,
            urls: searchurls,
            isInstant : isInstant,
            isCommentByKeyword : isCommentByKeyword,
            isCommentBySearchUrl: isCommentBySearchUrl,
            min : min,
            max : max,
            comment_cnt : comment_cnt,
            accounts: parsedAccounts
        },
        function(response) {console.log(response);});

    });

    
    
},
Popup.prototype.resetSetting = function() {
  Utils.local().set({
      setting: EX.Setting
  })
},
Popup.prototype.updateSetting = function(t, e, i) {
  EX.Utils.local().set({
      setting: {
          MAX_COMMENT_NUMBER: t,
          MIN_PLAY_TIME: e,
          MAX_PLAY_TIME: i
      }
  })
};
var $popup = new Popup;
$popup.init();

