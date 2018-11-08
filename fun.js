"use strict";

const DEBUG = true;

/* Checks */
const isArr = x => Array.isArray(x);

const isAny = (f, ...v) => reduce((x,y) => x == true || y == true, false, map(f, ...v));

const isEvery = (f, ...v) => reduce((x,y) => x == true && y == true, true, map(f, ...v));

const isDomElem = o => (typeof HTMLElement != "undefined" && o instanceof HTMLElement) || (typeof SVGElement != "undefined" && o instanceof SVGElement);

const isColl = o => isArr(o) || (typeof NodeList != "undefined" && o instanceof NodeList) || (typeof Set != "undefined" && o instanceof Set);

const isObj = o => typeof(o) == "object" && (o != null) && !isColl(o) && !isDomElem(o);

const isEmpty = a => {

    if(typeof a == "string" || isArr(a)) return a.length == 0;

    else if(isObj(a)) return Object.entries(a).length == 0;

    else return a == null || a == undefined;
    
};

const notEmpty = a => isEmpty(a)  ? null : a;

const find = (f,xs) => xs.find((...x) => f(...x)) || null;

/* Math Ops */
const degToRad = x => (x / 180) * Math.PI;

const radToDeg = x => (x * 180) / Math.PI;

/* Vector Operations */

const vAdd = ([x1,y1], [x2,y2]) => [x1 + x2, y1 + y2];

const vSub = ([x1,y1], [x2,y2]) => [x1 - x2, y1 - y2];

const vMul = ([x,y], m) => [x * m, y * m];

const vDiv = ([x,y], m) => [x / m, y / m];

const vRot = ([x,y], angleInDegrees) => {
    
    const angleInRad = degToRad(angleInDegrees);

    const cos = Math.cos(angleInRad), sin = Math.sin(angleInRad);

    return [x * cos - y * sin, x * sin + y * cos];

};

const vMag = ([x,y]) => Math.hypot(x, y);

/* Divides by 1 incase the vMag is 0. */
const vUnit = v => vDiv(v, vMag(v) || 1);

/* Array Ops */

const head = arr => arr[0];

const tail = arr => arr.slice(1);

const concat = (...arrs) => Array.prototype.concat(...arrs);

const transpose = colls => {

    let repetition = colls.length > 0 ? Math.min(...map(x => x.length, colls)) : 0;

    if(repetition == 0) return repeat([], colls.length);

    let idxs = notEmpty(range(0, (repetition - 1))) || [0];

    return map(i => map(x => x[i], colls), idxs);
    
};

/* Dictionary Ops */

const assoc = (s, k, v) => merge(s, {[k]: v});

const assocAbsent = (x,kvs) => {

    const assocOne = (x,k,v) => (k in x) ? x : merge(x,{[k]: v});

    return kvreduce((i,k,v) => assocOne(i,k,v), x, kvs);

};

const dissoc = (s, ...props) => reduce((init,next) => (delete init[next],init), merge({},s), props);

const merge = (...x) => Object.assign({},...x);

const update = (s, prop, f, v) => assoc(s,prop,f(s[prop] || {},v));

const selectKeys = (v,keys) => reduce((i,x) => (v[x] == 0 || v[x]) ? merge(i,{[x]: v[x]}) : i,{},keys);

const renameKeys = (m, keymap = {}) => kvreduce((_,k,v) => ((k in m) && (m[v] = m[k], delete m[k]), m), keymap);

/* Random */

const random = (min, max, attrs = {}) => {

    if(max == null) { max = min; min = 0; };

    let {asInt, seed, count = 1} = attrs;

    if(seed == null) seed = Date.now() + Math.random() * 1000000;

    const threshold = 2 ** 32;

    const rnd = (seed, threshold = 2 ** 32) => {

	const distributor = 2 ** 13 + 1;

	const prime = 1987;
	
	return ((seed * distributor) + prime) % threshold;

    }

    let res = [];

    let nextSeed = rnd(seed, threshold);

    for(let i = 0; i < count; i++) {

	let num = rnd(nextSeed);

	let normalized = num / threshold;

	let val = min + normalized * (max - min);
	
	res.push(asInt ? Math.round(val) : val);

	nextSeed = num;
    }

    return (count == 1) ? res[0] : res;
    
};

const randomVec = ([startX, startY], [endX, endY], attrs = {}) =>  {

    let [xSeed, ySeed] = random(1991, 4000, {count: 2, seed: attrs && attrs.seed || null, asInt: true});

    let xAttrs = Object.assign({count: 1}, attrs, {seed: xSeed});
    let yAttrs = Object.assign({count: 1}, attrs, {seed: ySeed});

    let randomXs = random(startX, endX, xAttrs);
    let randomYs = random(startY, endY, yAttrs);

    return (xAttrs.count == 1 && yAttrs.count == 1) ? [randomXs, randomYs] : map((x,y) => [x,y], randomXs, randomYs);

};

const randomItem = (arr = [], attrs) => {

    let indices = random(0, (arr.length - 1), merge(attrs, {asInt: true}), true);

    return (isArr(indices)) ? map(x => arr[x], indices) : (arr[indices] ? arr[indices] : null);

};

/* HOFs */

const partial = (f,x) => (y) => f(x,y);

const identity = x => x;

const repeat = (obj, times) => new Array(times).fill(obj);

const repeatedly = (f,times,v) => map(() => f(v), tail(range(0, times)));

const constantly = (f,times,v) => reduce((i,n) => f(i), v, range(1,times));

const interpose = (l1, l2) => mapcat((x,y) => [x,y], l1,l2);

const grid = ({x = 0,y = 0, width, height}, hdiv, vdiv, hasEdge = false, {width: tileWidth = 0, height: tileHeight = 0} = {}) => {

    let startX = x, endX = x + width;
    let startY = y, endY = y + height;

    let xs = steps(startX, endX, hdiv + 2);

    let ys = steps(startY, endY, vdiv + 2);

    if(!hasEdge) {
	xs = xs.slice(1, xs.length - 1);
	ys = ys.slice(1, ys.length - 1);
    }

    return mapcat(x => map(y => [x - tileWidth/2,y - tileHeight/2], ys), xs);
    
};

const reduce = (f, init, coll) => {

    if(!coll) { coll = init.slice(1); init = init[0];}

    for(let i = 0; i < coll.length; i++) init = f(init,coll[i]);

    return init;

};

const makeIterable = (o) => (o  && f.isObj(o)) ? Object.entries(o) : o;

const map = (f, coll, coll2, ...colls) => {

    const DEBUG = true;

    DEBUG && !isArr(coll) && console.warn("Please provide an array to map");

    let res = [], count = null;

    if(colls.length > 0) {

	DEBUG && !isEvery(x => isArr(x), colls) && console.warn("Please provide arrays as input");

	const bigColl = [coll,coll2].concat(colls);

	console.log(transpose(bigColl));

	return map(x => f.apply(null,x), transpose(bigColl));

    } else {

	DEBUG && !isArr(coll) && console.warn("Please provide an array to map along with first input");

	count = coll2 ? Math.min(coll.length, coll2.length) : coll.length;

	for(let i = 0; i < count; i++) {

	    (!coll2) ? res.push(f(coll[i])) : res.push(f(coll[i], coll2[i]));

	}

    }

    return res;

};

const mapidx = (f,coll) => {

    var res = [];

    for(var i = 0; i < coll.length; i++) {

	res.push(f(i,coll[i]));

    }

    return res;
}


const filter = (f, coll, coll2, ...colls) => {

    let res = [], count = null;

    if(colls.length > 0) {

	const bigColl = [coll,coll2].concat(colls);

	return filter(x => f.apply(null,x), transpose(bigColl));

    } else {

	count = coll2 ? Math.min(coll.length, coll2.length) : coll.length;

	for(let i = 0; i < count; i++) {

	    if(!coll2) {
		
		if(f(coll[i])) res.push(coll[i]);

	    } else {
		
		if(f(coll[i], coll2[i]))
		    res.push([coll[i], coll2[i]]);

	    }

	}

    }

    return res;

};

const mapcat = (f, ...colls) => reduce(concat, [], map(f,...colls));

const partition = (xs, n, step = 0) => {

    n = Math.max(n,1);

    step = Math.min(step, n - 1);

    let nextItem = 0;

    let result = [];

    for(var i = 0; i < xs.length; i += n) {

	i = Math.max(0, i - step);
	const start = i;
	const end = start + n;

	result.push(xs.slice(start, end));

    }

    let remaining = xs.slice(i + n);

    if(remaining.length > 0) result.push(remaining);

    return result;
    
};


const rollover = (x, count = 0, asCopy) => {

    let head = x.slice(0,count);

    if(asCopy) {

	return x.concat(head);

    } else {

	let tail = x.slice(count);

	return tail.concat(head);
    }
    
};


/* Range and Steps */

const range = (from, to, step) => {

    step = Math.abs(step) || 1;

    if(!to) { to = from; from = 0;}

    const r = [];

    const direction = Math.sign(to - from);

    for(let i = from; (direction != 0) && (direction > 0 ? i <= to : i >= to); i += step * direction) r.push(i);

    return r;

};

const steps = (from, to, count) => {

    /* Resort to 1 in case (count - 1) is zero
       Ensure division by zero is avoided */
    const scalar = count - 1 || 1;

    // Need to find a way to reduce the repetition of code for 2D and 1D
    if(isArr(from) && isArr(to)) {

	const dist = vSub(to, from);

	const stepSize = vDiv(dist, scalar);

	return map(step => vAdd(from, vMul(stepSize, step)), range(count).slice(0,-1));
	
    };

    const dist = to - from;

    const stepSize = dist/scalar;

    return map(step => from + (step * stepSize), range(count).slice(0,-1));

};

/* Object Ops */
const kvreduce = (f,init,o) => {

    if(o) {

	return Object.entries(o).reduce((acc, [k,v]) => f(acc,k,v), init);

    } else {

	o = init;

	return Object.entries(o).reduce((acc, [k,v]) => f(acc,k,v), {});

    }

}

const kvmap = (f,o) => kvreduce((acc,k,v) => merge(acc, f(k,v)), o);

const kvfilter = (f,o) => kvreduce((acc,k,v) => {

    let result = f(k,v);

    return result ? merge(acc, {[k]: v}) : acc;
    
}, o);

const mapKeys = (f,o) => kvreduce((acc,k,v) => merge(acc, {[f(k,v)]: v}), o);

const mapVals = (f,o) => kvreduce((acc,k,v) => merge(acc, {[k]: f(k,v)}), o);

/* Equality */

const objEq = (x,y) => {

    let xks = Object.keys(x).sort();
    let xvs = Object.values(x).sort();
    let yks = Object.keys(y).sort();
    let yvs = Object.values(y).sort();
    let innerChecks = xvs.length == yvs.length && isEvery(eq, xvs, yvs);
    let result = innerChecks && xks.length == yks.length && JSON.stringify(xks) === JSON.stringify(yks);
    return result;

};



const eq = (x,y) => {

    if(typeof Set != "undefined" && x instanceof Set && y instanceof Set) {

	return eq([...x].sort(), [...y].sort());
	
    } else if(isObj(x) && isObj(y)) {

	return objEq(x,y);

    } else if(isArr(x) && isArr(y)) {

	return x.length === y.length && isEvery(eq,x,y);

    } else {

	return x === y;
	
    }

};

/* Diffs */

// [3,4], [3, 5] => 5
// ["input", {type: "text", class: "valid"}] -> ["input", {type: "text", class: "invalid"}]
// {class: "invalid"}
const diffVals = (x, y, {showEq = true} = {}) => {
    
    if(eq(x,y)) {
	
	return (showEq ? {"eq": x} : null);

    } else {
	
	const result = merge({},(x ? {"sub": x} : {}), (y ? {"add": y} : {}));

	return (isEmpty(result)) ? null : result;

    }

}

const fillDelta = (arr1, arr2, filler = null) => {

    if(arr1.length == arr2.length) {

	return [arr1, arr2];

    } else if(arr1.length > arr2.length) {

	return [arr1, arr2.concat(repeat(filler, arr1.length - arr2.length))];

    } else {
	
	return [arr1.concat(repeat(filler, arr2.length - arr1.length)), arr2];
    }
    
};

const normalizeArrs = (arr1 = [], arr2 = [], filler = null) => fillDelta(arr1, arr2, filler);

// TODO:
// Alternate idea is [arr1, arr2].map(fillTillLengthOfMax)
// But this seems a bit of a tradeoff of ease of expression with speed
// TO THINK:
// Should I use null or undefined?

const diffObjs = (obj1, obj2, {showEq} = {}) => {
    
    return reduce((i,k) => {
	
	const result = diff(obj1[k], obj2[k], {showEq});

	return result != null ? merge(i,{[k]: diff(obj1[k], obj2[k])}) : i;

    }, {}, [...new Set(Object.keys(obj1).concat(Object.keys(obj2)))]);

};

const diffArrs = (arr1, arr2, {showEq} = {}) => map((x,y) => diff(x,y, {showEq}), ...normalizeArrs(arr1, arr2, null)).filter(x => x != null);

const diff = (state1, state2, {showEq} = {}) => {

    if(state1 instanceof Array && state2 instanceof Array) {

	return diffArrs(state1, state2, {showEq});
	
    } else if(state1 instanceof Object && state2 instanceof Object) {

	return diffObjs(state1, state2, {showEq});

    } else {

	return diffVals(state1, state2, {showEq});
	
    }
    
};

/* Loggers */

const log = (...x) => {

    console.log(x.map(JSON.stringify) + "");
    return x;
    
};

if(typeof module != "undefined" && module.exports) {
    module.exports = {merge, assoc, dissoc, update, renameKeys, transpose, repeat, range, steps, reduce, map, kvmap, kvfilter, mapKeys, mapVals, kvreduce, partition, rollover, grid, mapcat, objEq, eq, diffArrs, diffVals, diffObjs, diff, isArr, head, tail, isEmpty, log, normalizeArrs, isObj, partial, identity, find, random, randomVec, randomItem, vAdd, vSub, vMul, vDiv, vMag, vRot, vUnit, isAny, isEvery, notEmpty};
};

export {merge, assoc, dissoc, update, renameKeys, transpose, repeat, range, steps, reduce, map, kvmap, kvfilter, mapKeys, mapVals, kvreduce, partition, rollover, grid, mapcat, objEq, eq, diffArrs, diffVals, diffObjs, diff, isArr, head, tail, isEmpty, log, normalizeArrs, isObj, partial, identity, find, random, randomVec, randomItem, vAdd, vSub, vMul, vDiv, vMag, vRot, vUnit, isAny, isEvery, notEmpty};
