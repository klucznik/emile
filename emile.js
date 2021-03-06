// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.

(function(functionName, container) {

	// defaults
	var defaultDuration = 400;

	function defaultEase(position) { return (-Math.cos(position * Math.PI) / 2) + 0.5; }

	// generate unique string to mark currently animated elements
	var mark = "emile" + (new Date).getTime();

	var parseElem = document.createElement('div');
	var props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
		'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
		'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
		'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
		'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

	function getElement(elem) { return typeof elem == 'string' ? document.getElementById(elem) : elem; }

	var computedStyle = function(elem) { return elem.currentStyle; }

	if (document.defaultView && typeof document.defaultView.getComputedStyle !== 'undefined')
		computedStyle = function(elem) { return document.defaultView.getComputedStyle(elem, null); }

	// opacity support
	var reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/;
	var setOpacity = function(elem, value) { elem.style.opacity = value; };
	var getOpacity = function(comp) { return comp.opacity; };

	// support opacity for ie6 and 7 (ie8 supports normal opacity)
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

	// determines numerical value according to position (0 means begining and 1 end of animation)
	function interpolateNumber(source, target, position) {
		var objToReturn = source + (target - source) * position;
		return isNaN(objToReturn) ? objToReturn : objToReturn.toFixed(3);
	}

	// determines color value according to position
	function interpolateColor(source, target, position) {
		var i=3,
			tmp,
			values = [];

		source = parseColor(source);
		target = parseColor(target);

		while (i--) {
			// ~~ is faster version of Math.floor, also converts to integer
			tmp = ~~(source[i] + (target[i] - source[i]) * position);
			values.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp); // validate each value
		}

		return 'rgb(' + values.join(',') + ')';
	}

	// this function decides if property is numerical or color based
	function parse(prop) {
		var p = parseFloat(prop);
		var q = prop.replace(/^[\-\d\.]+/,'');

		if (isNaN(p))
			return { value: q, func: interpolateColor, unit: ''};
		else
			return { value: p, func: interpolateNumber, unit: q };
	}

	// parse color to array holding each basic color independently in decimal number
	function parseColor(color) {
		var values = [],
			j = 3;

		// rgb format
		if (letterAt(color,0) == 'r') {
			color = color.match(/\d+/g);
			while(j--)
				values.push(~~color[j]);
		}
		// hex format
		else {
			// if needed expand short hex (#FFF -> #FFFFFF)
			if (color.length == 4)
				color = '#' + letterAt(color,1) + letterAt(color,1) + letterAt(color,2) + letterAt(color,2) + letterAt(color,3) + letterAt(color,3);

			// convert hexadecimal to decimal values
			while(j--)
				values.push(parseInt(color.substr(1 + j*2, 2), 16));
		}

		return values;
	}

	// parses given css style string to js equivalents using browser engine
	function normalize(style) {
		var css,
			rules = {},
			i = props.length,
			value;

		parseElem.innerHTML = '<div style="' + style + '"></div>';
		css = parseElem.childNodes[0].style;
		while (i--) {
			if (value = css[props[i]])
				rules[props[i]] = parse(value);
		}

		return rules;
	}

	function emile(elem, style, opts) {
		elem = getElement(elem);
		opts = opts || {};

		var target = normalize(style),
			comp = computedStyle(elem),
			prop,
			current = {},
			start = +new Date,
			dur = isNaN(opts.duration) ? defaultDuration : opts.duration,
			easing = opts.easing || defaultEase,
			finish = start + dur,
			interval,
			curValue;

		// parse css properties
		for (prop in target) {
			if (prop !== 'opacity')
				current[prop] = parse(comp[prop]);
			else
				current[prop] = parse(getOpacity(comp));
		}

		// stop previous animation
		if (elem[mark])
			clearInterval(elem[mark]);

		// mark element as being animated and start main animation loop
		elem[mark] = interval = setInterval(function() {
			var time = +new Date;
			var position = (time > finish) ? 1 : (time - start) / dur;

			// update element values
			for (prop in target) {
				curValue = target[prop].func(current[prop].value, target[prop].value, easing(position)) + target[prop].unit;
				if (prop === 'opacity')
					setOpacity(elem, curValue);
				else
					elem.style[prop] = curValue;
			}

			// check for animation end
			if (time > finish) {
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

	// declare externs
	container[functionName] = emile;
	container[functionName].stopAnimation = stopAnimation;

})('emile', this);