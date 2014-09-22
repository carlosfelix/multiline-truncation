(function () {
	var utils = {
		getInnerHeight: function (element) {
			var innerHeight, properties, computedStyle;
			if (window.getComputedStyle) {
				computedStyle = window.getComputedStyle(element);
				return parseInt(computedStyle.maxHeight, 10) || parseInt(computedStyle.height, 10);
			}
			innerHeight = element.offsetHeight;
			properties = ['paddingTop', 'paddingBottom'];
			for (var i = properties.length; i--;) {
				innerHeight -= parseInt(element.currentStyle ? element.currentStyle[properties[i]] : element.style[properties[i]], 10 ) || 0;
			}
			return innerHeight;
		},
		emptyingElement: function (element) {
			while ( element.firstChild ) {
				element.removeChild( element.firstChild );
			}
		},
		getTextContent: function (node) {
			return node.innerText || node.nodeValue || node.textContent || "";
		},
		setTextContent: function (nodeToTruncate, content) {
			if (nodeToTruncate.innerText) {
				nodeToTruncate.innerText = content;
			}
			else if (nodeToTruncate.nodeValue) {
				nodeToTruncate.nodeValue = content;
			}
			else if (nodeToTruncate.textContent) {
				nodeToTruncate.textContent = content;
			}
		},
		extend: function (destinationObj, originObj) {
			var finalObj = destinationObj;
			for (var prop in originObj) {
				finalObj[prop] = originObj[prop];
			}
			return finalObj;
		},
		appendNodes: function (origin, destination) {
			while(origin.hasChildNodes()) {
				destination.appendChild(origin.removeChild(origin.firstChild));
			}
		},
		addEventListener: function (element, eventName, fn) {
			if (element.addEventListener) {
				element.addEventListener(eventName, fn);
			}
			else if (element.attachEvent){
				if (element['on' + eventName] !== undefined) {
					element.attachEvent('on' + eventName, fn);
				}
				else {
					element[eventName] = 0;
					element.attachEvent('onpropertychange', function (e) {
						if(e.propertyName === eventName) {
							fn();
						}
					});
				}
			}
		},
		removeEventListener: function(element, eventName, fn) {
			if(element.removeEventListener) {
				element.removeEventListener(eventName, fn);
			}
			else {
				element.detachEvent('on' + eventName, fn);
			}
		},
		indexOf: function (value, arr) {
			for (var i = arr.length; i--;) {
				if (arr[i] === value) {
					return i;
				}
			}
			return -1;
		}
	};

	var CustomEventHandler = {
		events: {},
		addListener: function (element, eventName, callback) {
			if (!CustomEventHandler.events[eventName]) {
				CustomEventHandler.createEvent(eventName);
			}

			utils.addEventListener(element, eventName, function (evt) {
				callback(evt);
			}, false);
		},
		createEvent: function (eventName) {
			var customEvent;
			if (document.createEvent) {
				customEvent = document.createEvent('HTMLEvents');
				customEvent.initEvent(eventName,true,true);
				CustomEventHandler.events[eventName] = customEvent;
			}
			else if (window.CustomEvent) {
				CustomEventHandler.events[eventName] = new CustomEvent(eventName, {
					cancelable: false
				});
			}
			else if (document.createEventObject) {
				CustomEventHandler.events[eventName] = document.createEventObject();
				CustomEventHandler.events[eventName].eventType = 'propertychange';
			}
		},
		dispatchEvent: function (element, eventName) {
			var evt = CustomEventHandler.events[eventName];
			if (evt) {
				if (element.dispatchEvent) {
					element.dispatchEvent(evt);
				}
				else if (element[eventName] !== undefined) {
					element[eventName]++;
				}
			}
		}
	};


	var isLessThanMaxHeight = function (innerElement, options) {
		return innerElement.offsetHeight > options.maxHeight;
	};


	var appendTripleDot = function (text, options) {
		var removeCharsArray = options.lastCharacter.remove;

		while((removeCharsArray.indexOf ? removeCharsArray.indexOf(text.slice(-1)) : utils.indexOf(text.slice(-1), removeCharsArray)) > -1) {
			text = text.slice(0, -1);
		}

		return text + options.tripleDotChars;
	};


	var truncateElement = function (nodeToTruncate, element, innerElement, options) {
		if ( typeof nodeToTruncate === 'undefined' ) {
			return false;
		}

		var isTruncated	= false,
			txt = '',
			separator = ' ',
			textArr = utils.getTextContent(nodeToTruncate).split(separator),
			position = -1,
			midPos = -1,
			startPos = 0,
			endPos = textArr.length - 1;

		while (startPos <= endPos) {
			var m = Math.floor((startPos + endPos)/2);
			if (m === midPos) {
				break;
			}
			midPos = m;

			utils.setTextContent(nodeToTruncate, textArr.slice(0, midPos+1).join(separator) + options.tripleDotChars);

			if (!isLessThanMaxHeight(innerElement, options)) {
				position = midPos;
				startPos = midPos;
			}
			else {
				endPos = midPos;
			}
		}

		if ( position !== -1 && !(textArr.length === 1 && textArr[0].length === 0)) {
			txt = appendTripleDot( textArr.slice( 0, position + 1 ).join(separator), options );
			isTruncated = true;
			utils.setTextContent(nodeToTruncate, txt);
		}
		else
		{
			var parentNode = nodeToTruncate.parentNode;
			parentNode.removeChild(nodeToTruncate);

			var afterLength = 0;

			if (parentNode.childNodes.length > afterLength ) {
				isTruncated = truncateElement(parentNode.childNodes[-1-afterLength], element, innerElement, options);
			}
			else
			{
				nodeToTruncate = parentNode.previousSibling && parentNode.previousSibling.childNodes.length && parentNode.previousSibling.childNodes[parentNode.previousSibling.childNodes.length - 1];
				if (nodeToTruncate) {
					txt = appendTripleDot(getTextContent(nodeToTruncate), options);
					utils.setTextContent(nodeToTruncate, txt);
					parentNode.parentNode.removeChild(parentNode);
					isTruncated = true;
				}
			}
		}

		return isTruncated;
	};

	var truncateContent = function (nodeToTruncate, element, innerElement, options) {
		var isTruncated	= false,
			clonedChildNodes = nodeToTruncate.cloneNode(true).childNodes,
			clonedNode;

		utils.emptyingElement(nodeToTruncate);

		for ( var i = 0, length = clonedChildNodes.length; i < length; i++ ) {
			if (isTruncated){
				break;
			}
			clonedNode = clonedChildNodes[i].cloneNode(true);
			if (typeof clonedNode === 'undefined') {
				continue;
			}
			nodeToTruncate.appendChild(clonedNode);

			//If text node
			if (clonedNode.nodeType === 3) {
				if (isLessThanMaxHeight(innerElement, options)) {
					isTruncated = truncateElement(clonedNode, element, innerElement, options);
				}
			}
			else {
				isTruncated = truncateContent(clonedNode, element, innerElement, options);
			}

		}
		return isTruncated;
	};


	var internalData = {
		cache:  {},
		counter: 0,
		set: function (elem, key, value) {
			if ( elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9 ) {
				return false;
			}

			if (!elem.internalId) {
				elem.internalId = internalData.counter++;
			}

			var cacheObj = internalData.cache[elem.internalId];
			if (!cacheObj) {
				cacheObj = internalData.cache[elem.internalId] = {};
			}

			if (value) {
				cacheObj[key] = value;
			}
		},
		get: function (elem, key){
			return internalData.cache && internalData.cache[elem.internalId] && internalData.cache[elem.internalId][key];
		}
	};


	var resizeEvents = {};

	var winResizeSupport = function (element, options) {
		var windowWidth = document.documentElement.clientWidth,
			windowHeight = document.documentElement.clientHeight,
			resizeEvent = resizeEvents[element.internalId];

		if (resizeEvent) {
			utils.removeEventListener(window, 'resize', resizeEvent);
		}

		resizeEvent = resizeEvents[element.internalId] = function() {
			if (windowWidth !== document.documentElement.clientWidth || windowHeight !== document.documentElement.clientHeight || !options.windowResizeFix ) {
				windowWidth = document.documentElement.clientWidth;
				windowHeight = document.documentElement.clientHeight;
				setTimeout(function() {
					CustomEventHandler.dispatchEvent(element, 'update.tripledot');
				}, 10);
			}
		};


		utils.addEventListener(window, 'resize', resizeEvent);
	};

	var wireEvents = function (originalNode, element, options) {

		if (options.winResizeSupport) {
			winResizeSupport(element, options);
		}

		CustomEventHandler.addListener(element, 'destroy.tripledot', function (e, c) {
			var resizeEvent = resizeEvents[element.internalId];
			if (resizeEvent) {
				utils.removeEventListener(window, 'resize', resizeEvent);
			}
		});

		CustomEventHandler.addListener(element, 'update.tripledot', function (e, c) {
			var clonedNode = originalNode.cloneNode(true),
				clonedChildNodes = clonedNode.childNodes,
				innerDiv = document.createElement('div'),
				innerDivStyle = innerDiv.style,
				isContentTruncated;

			options.maxHeight = typeof options.height === 'number' ? options.height : utils.getInnerHeight(element);

			innerDiv.className = "tripledot";
			utils.emptyingElement(element);
			element.appendChild(innerDiv);
			utils.appendNodes(clonedNode, innerDiv);

			innerDivStyle.height = 'auto';
			innerDivStyle.width = 'auto';
			innerDivStyle.border = 'none';
			innerDivStyle.padding = "0";
			innerDivStyle.margin = "0";


			if (isLessThanMaxHeight(innerDiv, options)) {
				isContentTruncated = truncateContent(innerDiv, element, innerDiv, options);
			}

			utils.appendNodes(innerDiv, element);

			element.removeChild(innerDiv);

			if (options.callback && typeof options.callback === 'function') {
				options.callback(element, isContentTruncated, clonedChildNodes);
			}

			return isContentTruncated;
		});
	};

	var defaultOptions = {
		tripleDotChars	: '... ',
		wrap			: 'word',
		lastCharacter: {
			remove: [ ' ', ',', ';', '.', '!', '?' ]
		},
		height : null,
		winResizeSupport : true,
		windowResizeFix: true
	};

	window.truncate = function (element, options) {
		options = utils.extend(defaultOptions, options || {});
		if (internalData.get(element, 'tripledot')) {
			CustomEventHandler.dispatchEvent(element, 'destroy.tripledot');
		}
		internalData.set(element, 'tripledot', true);
		wireEvents(element.cloneNode(true), element, options);
		CustomEventHandler.dispatchEvent(element, 'update.tripledot');
	};
})({});