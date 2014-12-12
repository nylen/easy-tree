function Tree(obj) {
    if (!(this instanceof Tree)) {
        return new Tree(obj);
    }

    var self = this;

    if (Array.isArray(obj)) {
        obj = { children : obj };
    }

    if (typeof obj == 'object') {
        Object.keys(obj).forEach(function(k) {
            if (k != 'children' && !(k in Tree.prototype)) {
                self[k] = obj[k];
            }
        });
    }

    self.children = [];

    if (obj && obj.children && obj.children.length) {
        obj.children.forEach(function(child) {
            self.append([], child);
        });
    }
};

Tree.prototype.get = function(path) {
    return this._doAtPath(path, 0, 0, 0, function(node) {
        return node;
    });
};

Tree.prototype.prepend = function(path, child) {
    var self = this;

    return self._doAtPath(path, 0, 0, 0, function(node) {
        node.children.unshift(self._makeTree(child));
        return node.children.length;
    });
};

Tree.prototype.insertBefore = function(path, child) {
    var self = this;

    return self._doAtPath(path, 1, 0, 1, function(node, i) {
        node.children.splice(i, 0, self._makeTree(child));
        return node.children.length;
    });
};

Tree.prototype.append = function(path, child) {
    var self = this;

    return self._doAtPath(path, 0, 0, 0, function(node) {
        node.children.push(self._makeTree(child));
        return node.children.length;
    });
};

Tree.prototype.insertAfter = function(path, child) {
    var self = this;

    return self._doAtPath(path, 1, 1, 0, function(node, i) {
        node.children.splice(i + 1, 0, self._makeTree(child));
    });
};

Tree.prototype.remove = function(path) {
    return this._doAtPath(path, 1, 0, 0, function(node, i) {
        var toRemove = node.children[i];
        node.children.splice.apply(
            node, [i, 1].concat(toRemove.children));
        toRemove.children = [];
        return toRemove;
    });
};

Tree.prototype.prune = function(path) {
    return this._doAtPath(path, 1, 0, 0, function(node, i) {
        var toRemove = node.children[i];
        node.children.splice(i, 1);
        return toRemove;
    });
};

Tree.prototype.walk = function(cb) {
    var self = this;

    if (typeof cb != 'function') {
        cb = function() { };
    }

    cb([], self);
    return self._walk(cb, [], 1);
};

Tree.prototype._walk = function(cb, path, n) {
    var self = this;

    for (var i = 0; i < self.children.length; i++) {
        var child     = self.children[i],
            childPath = path.concat(i);
        cb(childPath, child);
        n += child._walk(cb, childPath, 0) + 1;
    }

    return n;
};

Tree.prototype.keys = function() {
    return Object.keys(this).filter(function(k) {
        return (k != 'children');
    });
};

// nSkip     : number of path elements to validate but not include in the path
//             used to perform the operation (also the minimum path length)
// nRelaxMin : offset by which to relax the minimum bound of the last path
//             element (so that insertAfter can prepend an element)
// nRelaxMax : offset by which to relax the maximum bound of the last path
//             element (so that insertBefore can append an element)
Tree.prototype._doAtPath = function(path, nSkip, nRelaxMin, nRelaxMax, operation) {
    var self = this;

    var treeCurrent = self,
        treeFinal   = treeCurrent;

    if (!Array.isArray(path)) {
        throw new Error('Tree paths must be arrays.');
    }
    if (path.length < nSkip) {
        self._throwPathError(path, 'minimum length ' + nSkip + ' not met');
    }

    for (var i = 0; i < path.length; i++) {
        var p = path[i];
        if (typeof p != 'number') {
            self._throwPathError(path, i, 'not a number');
        }
        if (p % 1) {
            self._throwPathError(path, i, 'not an integer');
        }
        var min = 0 - nRelaxMin,
            max = treeCurrent.children.length - 1 + nRelaxMax;
        if (p < min) {
            self._throwPathError(path, i, 'below minimum value of ' + min);
        }
        if (p > max) {
            self._throwPathError(path, i, 'above maximum value of ' + max);
        }
        treeCurrent = treeCurrent.children[p];
        if (i < path.length - nSkip) {
            treeFinal = treeCurrent;
        }
    }

    return operation(treeFinal, path[path.length - 1]);
};

Tree.prototype._throwPathError = function(path, i, problem) {
    if (typeof problem == 'undefined') {
        problem = i;
        i = null;
    }

    var msg = 'Bad tree path [ ' + path.map(function(p) {
        return p.toString();
    }).join(', ') + ' ]:';

    if (typeof i == 'number') {
        msg += ' ' + path[i] + ' (index ' + i + ') is';
    }

    throw new Error(msg + ' ' + problem + '.');
};

Tree.prototype._makeTree = function(obj) {
    if (obj instanceof Tree) {
        return obj;
    } else {
        return new Tree(obj);
    }
};

module.exports = exports = Tree;
