const fun = ((ctx) => {

    "use strict";
    
    const merge = (...x) => Object.assign({},...x);

    const assoc = (s, k, v) => merge(s, {[k]: v});
    
    const dissoc = (s, ...props) => reduce((init,next) => (delete init[next],init), merge({},s),props);

    const update = (s, prop, f, v) => assoc(s,prop,f(s[prop],v));

    const renameKeys = (m, keymap = {}) => kvreduce((_,k,v) => ((k in m) && (m[v] = m[k], delete m[k]), m), keymap);

    const transpose = colls => {

        let repetition = colls.length > 0 ? Math.min(...map(x => x.length, colls)) : 0;

        return map(i => map(x => x[i], colls), range(0,repetition - 1));
        
    }

    const repeat = (obj, times) => new Array(times).fill(obj);

    const range = (from, to, step) => {

        step = Math.abs(step) || 1;

        if(!to) { to = from; from = 0;}

        const r = [];

        const direction = Math.sign(to - from);

        for(let i = from; (direction != 0) && (direction > 0 ? i <= to : i >= to); i += step * direction) r.push(i);

        return r;

    };

    const steps = (from, to, count) => range(from, to, (to - from) / (count - 1));

    const reduce = (f, init, coll) => {

        if(!coll) { coll = init.slice(1); init = init[0];}

        for(let i = 0; i < coll.length; i++) init = f(init,coll[i]);

        return init;

    };
    
    const map = (f, coll, coll2, ...colls) => {

        let res = [], count = null;

        if(colls.length > 0) {

	    const bigColl = [coll,coll2].concat(colls);

	    return map(x => f.apply(null,x), transpose(bigColl));

        } else {

            count = coll2 ? Math.min(coll.length, coll2.length) : coll.length;

	    for(let i = 0; i < count; i++) {

	        (!coll2) ? res.push(f(coll[i])) : res.push(f(coll[i], coll2[i]));

            }

        }

        return res;

    };

    const kvreduce = (f, init = {}, acc = init) => Object.entries(acc).reduce((i,[k,v]) => f(i,k,v), init);

    return {merge, assoc, dissoc, update, renameKeys, transpose, repeat, range, steps, reduce, map, kvreduce};

})(this);

if(typeof module != "undefined" && module.exports) module.exports = fun;
