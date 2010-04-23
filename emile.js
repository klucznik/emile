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
		setOpacity = function(el, value){ el.style.opacity = value; };
		getOpacityFromComputed = function(computed) { return computed.opacity; };
	}
	else if (typeof parseEl.style.filter == 'string') {
		setOpacity = function(el, value) {
			var es = el.style;
			if (el.currentStyle && !el.currentStyle.hasLayout) es.zoom = 1;
			if (reOpacity.test(es.filter)) {
				value = value >= 0.9999 ? '' : ('alpha(opacity=' + (value * 100) + ')');
				es.filter = es.filter.replace(reOpacity, value);
			}
			else {
				es.filter += ' alpha(opacity=' + (value * 100) + ')';
			}
		};

		getOpacityFromComputed = function(comp) {
			var m = comp.filter.match(reOpacity);
			return (m ? (m[1] / 100) : 1) + '';
		};
	}

	function interpolate(source, target, pos) {
		var objToReturn = source + (target - source) * pos;
		return isNaN(objToReturn) ? objToReturn : objToReturn.toFixed(3);
	}

	function s(str, p, c) {
		return str.substr(p, c || 1);
	}

	function color(source, target, pos) {
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
		var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
		return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
	}

	function normalize(style) {
		var css, rules = {}, i = props.length, v;
		parseEl.innerHTML = '<div style="'+style+'"></div>';
		css = parseEl.childNodes[0].style;
		while(i--)
			if(v = css[props[i]]) rules[props[i]] = parse(v);
		return rules;
	}

	function getElement(el) {
		return typeof el == 'string' ? document.getElementById(el) : el;
	}

	function computedStyle(el) {
		return el.currentStyle ? el.currentStyle : window.getComputedStyle(el, null);
	}

	container[emile] = function(el, style, opts) {
		el = getElement(el);
		opts = opts || {};

		var target = normalize(style);
		var comp = computedStyle(el),
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
		if (el.emile)
			clearInterval(el.emile);

		el.emile = interval = setInterval(function() {
			var time = +new Date,
			pos = time > finish ? 1 : (time - start) / dur;

			for(prop in target) {
				curValue = target[prop].f(current[prop].v, target[prop].v, easing(pos)) + target[prop].u;
				if (prop === 'opacity') setOpacity(el, curValue);
				else el.style[prop] = curValue;
			}
			if(time > finish) {
				container[emile].stopAnimation(el);
				opts.after && opts.after();
			}
		}, 10);
	}

	container[emile].stopAnimation = function(el) {
		el = getElement(el);
		if (el.emile) {
			clearInterval(el.emile);
			delete el.emile;
		}
	}

})('emile', this);