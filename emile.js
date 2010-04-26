// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(emile, container) {

	var parseEl = document.createElement('div');
	var props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
		'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
		'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
		'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
		'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

	// opacity
	var reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/;
	var setOpacity = function() {};
	var getOpacityFromComputed = function() { return '1'; };

	if (typeof parseEl.style.opacity == 'string') {
		setOpacity = function(elem, value){ elem.style.opacity = value; };
		getOpacityFromComputed = function(computed) { return computed.opacity; };
	}
	else if (typeof parseEl.style.filter == 'string') {
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

		getOpacityFromComputed = function(comp) {
			var m = comp.filter.match(reOpacity);
			return (m ? (m[1] / 100) : 1) + '';
		};
	}

	function s(str, p, c) {
		return str.substr(p, c || 1);
	}

	function interpolate(source, target, pos) {
		var objToReturn = source + (target - source) * pos;
		return isNaN(objToReturn) ? objToReturn : objToReturn.toFixed(3);
	}

	function interpolateColor(source, target, pos) {
		var i = 2, j, c, tmp, v = [], r = [];

		while(j=3, c=arguments[i-1], i--) {
			if(s(c,0)=='r') {
				c = c.match(/\d+/g);
				while(j--)
					v.push(~~c[j]);
			}
			else {
				if(c.length==4) c='#' + s(c,1) + s(c,1) + s(c,2) + s(c,2) + s(c,3) + s(c,3);
				while(j--)
					v.push(parseInt(s(c, 1 + j * 2, 2), 16));
			}
		}

		while(j--) {
			tmp = ~~(v[j + 3] + (v[j] - v[j + 3]) * pos);
			r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
		}
		return 'rgb(' + r.join(',') + ')';
	}

	function parse(prop) {
		var p = parseFloat(prop);
		var q = prop.replace(/^[\-\d\.]+/,'');

		if (isNaN(p))
			return { value: q, func: interpolateColor, unit: ''};
		else
			return { value: p, func: interpolate, unit: q };
	}

	function normalize(style) {
		var css, rules = {}, i = props.length, v;
		parseEl.innerHTML = '<div style="'+style+'"></div>';
		css = parseEl.childNodes[0].style;
		while(i--)
			if(v = css[props[i]]) rules[props[i]] = parse(v);
		return rules;
	}

	function getElement(elem) {
		return typeof elem == 'string' ? document.getElementById(elem) : elem;
	}

	function computedStyle(elem) {
		return elem.currentStyle ? elem.currentStyle : window.getComputedStyle(elem, null);
	}

	container[emile] = function(elem, style, opts) {
		elem = getElement(elem);
		opts = opts || {};

		var target = normalize(style);
		var comp = computedStyle(elem),
		prop,
		current = {},
		start = +new Date,
		dur = opts.duration || 400,
		finish = start + dur,
		interval,
		easing = opts.easing || function(pos) { return (-Math.cos(pos * Math.PI) / 2) + 0.5; },
		curValue;

		for(prop in target)
			current[prop] = parse(prop === 'opacity' ? getOpacityFromComputed(comp) : comp[prop]);

		//stop previous animation
		if (elem.emile)
			clearInterval(elem.emile);

		elem.emile = interval = setInterval(function() {
			var time = +new Date,
			pos = time > finish ? 1 : (time - start) / dur;

			for(prop in target) {
				curValue = target[prop].func(current[prop].value, target[prop].value, easing(pos)) + target[prop].unit;
				if (prop === 'opacity') setOpacity(elem, curValue);
				else elem.style[prop] = curValue;
			}
			if(time > finish) {
				container[emile].stopAnimation(elem);
				opts.after && opts.after();
			}
		}, 10);
	}

	container[emile].stopAnimation = function(elem) {
		elem = getElement(elem);
		if (elem.emile) {
			clearInterval(elem.emile);
			elem.emile = null;
		}
	}

})('emile', this);