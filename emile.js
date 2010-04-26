// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(functionName, container) {

	//defaults
	var defaultDuration = 400;

	function defaultEase(position) { return (-Math.cos(position * Math.PI) / 2) + 0.5; }

	//generate unique string to mark currently animated elements
	var mark = "emile" + (new Date).getTime();

	var parseElem = document.createElement('div');
	var props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
		'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
		'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
		'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
		'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

	// opacity support
	var reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/;
	var setOpacity = function(elem, value) { elem.style.opacity = value; };
	var getOpacity = function(comp) { return comp.opacity; };

	//support opacity for ie6 and 7 (ie8 supports normal opacity)
	if (typeof parseElem.style.filter == 'string' && typeof parseElem.style.opacity != 'string') {
		setOpacity = function(elem, value) {
			var es = elem.style;
			if (elem.currentStyle && !elem.currentStyle.hasLayout) es.zoom = 1;
			if (reOpacity.test(es.filter)) {
				value = value >= 0.9999 ? '' : ('alpha(opacity=' + (value * 100) + ')');
				es.filter = es.filter.replace(reOpacity, value);
			}
			else
				es.filter += ' alpha(opacity=' + (value * 100) + ')';
		};

		getOpacity = function(comp) {
			var m = comp.filter.match(reOpacity);
			return (m ? (m[1] / 100) : 1) + '';
		};
	}

	function letterAt(str, index) { return str.substr(index, 1); }

	//determines numerical value according to position (0 means begining and 1 end of animation)
	function interpolateNumber(source, target, position) {
		var objToReturn = source + (target - source) * position;
		return isNaN(objToReturn) ? objToReturn : objToReturn.toFixed(3);
	}

	//determines color value according to position
	function interpolateColor(source, target, position) {
		var i = 2,
			j,
			c,
			tmp,
			v = [],
			r = [];

		while(j=3, c=arguments[i-1], i--) {
			if(letterAt(c,0)=='r') {
				c = c.match(/\d+/g);
				while(j--)
					v.push(~~c[j]);
			}
			else {
				if(c.length==4)
					c = '#' + letterAt(c,1) + letterAt(c,1) + letterAt(c,2) + letterAt(c,2) + letterAt(c,3) + letterAt(c,3);
				while(j--)
					v.push(parseInt(c.substr(1+j*2, 2), 16));
			}
		}

		while(j--) {
			tmp = ~~(v[j + 3] + (v[j] - v[j + 3]) * position);
			r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
		}

		return 'rgb(' + r.join(',') + ')';
	}

	//this function decides if property is numerical or color based
	function parse(prop) {
		var p = parseFloat(prop);
		var q = prop.replace(/^[\-\d\.]+/,'');

		if (isNaN(p))
			return { value: q, func: interpolateColor, unit: ''};
		else
			return { value: p, func: interpolateNumber, unit: q };
	}

	//parses given css style string to js equivalents using browser engine
	function normalize(style) {
		var css,
			rules = {},
			i = props.length,
			v;

		parseElem.innerHTML = '<div style="' + style + '"></div>';
		css = parseElem.childNodes[0].style;
		while(i--)
			if(v = css[props[i]]) rules[props[i]] = parse(v);

		return rules;
	}

	function getElement(elem) {
		return typeof elem == 'string' ? document.getElementById(elem) : elem;
	}

	function computedStyle(elem) {
		return elem.currentStyle ? elem.currentStyle : window.getComputedStyle(elem, null);
	}

	function emile(elem, style, opts) {
		elem = getElement(elem);
		opts = opts || {};

		var target = normalize(style),
			comp = computedStyle(elem),
			prop,
			current = {},
			start = +new Date,
			dur = opts.duration || defaultDuration,
			finish = start + dur,
			interval,
			easing = opts.easing || defaultEase,
			curValue;

		//parse css properties
		for(prop in target) {
			if (prop === 'opacity')
				current[prop] = parse(getOpacity(comp));
			else
				current[prop] = parse(comp[prop]);
		}

		//stop previous animation
		if (elem[mark])
			clearInterval(elem[mark]);

		//mark element as being animated and start main animation loop
		elem[mark] = interval = setInterval(function() {
			var time = +new Date;
			var position = (time > finish) ? 1 : (time - start) / dur;

			//update element values
			for(prop in target) {
				curValue = target[prop].func(current[prop].value, target[prop].value, easing(position)) + target[prop].unit;
				if (prop === 'opacity')
					setOpacity(elem, curValue);
				else
					elem.style[prop] = curValue;
			}

			//check for animation end
			if(time > finish) {
				stopAnimation(elem);
				opts.after && opts.after();
			}
		}, 10);
	}

	function stopAnimation(elem) {
		elem = getElement(elem);
		if (elem[mark]) {
			clearInterval(elem[mark]);
			elem[mark] = null;
		}
	}

	//declare externs
	container[functionName] = emile;
	container[functionName].stopAnimation = stopAnimation;

})('emile', this);