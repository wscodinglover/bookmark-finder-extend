(function(){
	var data = this.urls,
		currentItem = -1,
		searchItems,
		input = document.getElementsByTagName("input")[0],
		dd = document.getElementsByTagName("dd")[0];

	input.addEventListener('keyup', search, false);
	//input paste event
	input.addEventListener('paste', function(){
		setTimeout(function(){search({keyCode:-1});},50);
	}, false);

	//focus input
	input.focus();

	//add keydown event to document
	document.addEventListener('keydown', function(e){
		//select item
		if(e.keyCode === 38 || e.keyCode ===40){
			input.focus();
		}
	}, false);

	//search keywords
	function search(e){
		//select item
		if(e.keyCode === 38 || e.keyCode ===40 || e.keyCode === 13){
			selectItem(e.keyCode);
			return;
		}

		var keyword = input.value,
			startTimeStamp = new Date().getTime();

		if(keyword == ''){
			restoreDefaultView();
			return;
		}

		searchInBookmarks(keyword);
	}

	//select item
	function selectItem(keyCode){
		//previous item
		if(keyCode === 38){
			currentItem--;
			if(currentItem < 0){
				currentItem = searchItems.length-1;
			}
		}

		//next item
		if(keyCode === 40){
			currentItem++;
			if(currentItem > searchItems.length-1){
				currentItem = 0;
			}
		}

		//enter
		if(keyCode === 13){
			var url = searchItems[currentItem>-1?currentItem:0].getAttribute("href");
			if(url){
				input.value = '';
				chrome.tabs.create({
					'url' : url,
					'active' : true
				});
			}
			return;
		}

		var el = searchItems[currentItem],
			className = el.getAttribute("class");
		resetItemClass();
		el.setAttribute('class', className?className+' selected':'selected');
		input.value = el.innerHTML.replace(/<strong>(.*)<\/strong>|<span.*/g,'$1');
	}

	function resetItemClass(){
		for(var i = 0, L = searchItems.length, className="", el=null; i < L; i++){
			el = searchItems[i];
			className = el.getAttribute("class");
			if(className){
				el.setAttribute("class", className.replace("selected",""));
			}
		}
	}

	function restoreDefaultView(){
		dd.innerHTML = '';
		dd.style.display = 'none';
	}

	function getMatchedList(dataArray, keyword){
		var result = [];

		for(var i=0,L=dataArray.length,obj={},className=''; i<L; i++){
			obj = dataArray[i];

			if(!obj.keywords){
				obj.keywords = obj.title;
			}

			if(obj.id){
				className=' class="bookmarkitem"';
			}

			var regex = new RegExp(`${keyword}`,'gi')
			if(regex.test(obj.keywords)){
				if(obj.url){
					result.push('<a href="'+obj.url+'"'+className+'>'+addStyle(keyword,obj.title)+'<span class="url">'+obj.url+'</span></a>');
				}else if(obj.content){
					result.push('<a'+className+'>'+addStyle(keyword,obj.title)+'<span class="text">'+obj.content+'</span></a>');
				}
			}
		}

		return result;
	}

	/**
	 *  将原始内容按关键字进行替换（不区分大小写）
	 *
	 * @param {string} word  需要替换的关键字
	 * @param {string} str   原始内容
	 * @returns
	 */
	function addStyle(word, str){
		var reg = new RegExp(`${word}`,'gi');
		var matchWordArr = str.match(reg);
		if(matchWordArr){
			matchWordArr.forEach(item=>{
				var wordReg = new RegExp(`(<span class='red'>)?${item}(</span>)?`,'g');;
				str = str.replace(wordReg,`<strong>${item}</strong>`)
			})
		}
		return str
	};

	function showMatchedList(result){
		if(result.length < 1){
			restoreDefaultView();
			return;
		}

		dd.style.display = 'block';
		dd.innerHTML = result.join('');

		searchItems = dd.getElementsByTagName("a");
		currentItem = -1;
	}

	function searchInBookmarks(keyword){
		keyword = keyword || "";
		chrome.bookmarks.search(keyword, function(bookmarksArray){
			var matchedList=[];
			matchedList = matchedList.concat(getMatchedList(bookmarksArray, keyword));

			showMatchedList(matchedList);
		});
	}
})();