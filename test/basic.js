var fs    = require('fs'),
    Tree  = require('../index'),
    mocha = require('mocha'),
    must  = require('must'),
    path  = require('path');

describe('easy-tree', function() {
    var tree;

    function getDataFilename(f, ext) {
        ext = ext || 'json';
        return path.join(__dirname, 'data', f + '.' + ext);
    }

    function readDataFile(f, ext) {
        return fs.readFileSync(getDataFilename(f, ext), 'utf8');
    }

    var template = readDataFile('../template');

    function newTree() {
        return new Tree(JSON.parse(template));
    }

    function describeTree(t) {
        var lines = [];
        t.walk(function(path, node) {
            var line = '',
                keys = node.keys([]);
            if (path.length) {
                line += path.join(',');
            } else {
                line += '[]';
            }
            line += '\t: ';
            if (keys.length) {
                line += node.keys([]).map(function(k) {
                    return k + '=' + node[k];
                }).join(';');
            } else {
                line += '(no data)';
            }
            lines.push(line);
        });
        return lines;
    }

    beforeEach(function() {
        tree = newTree();
    });

    function assertTreeMatchesFile(t, f) {
        if (typeof f == 'undefined') {
            f = t;
            t = tree;
        }

        // Code to create test files if they don't exist - this is useful when
        // adding tests, BUT it does require manual verification that the new
        // test generates the intended result!!  Use the `test/data/diff.sh`
        // script to help with this.
        if (process.env.TEST_DEV && !fs.existsSync(getDataFilename(f))) {
            fs.writeFileSync(
                getDataFilename(f),
                require('json-align')(t));
            fs.writeFileSync(
                getDataFilename(f, 'txt'),
                describeTree(t).join('\n') + '\n');
        }

        JSON.parse(JSON.stringify(t)).must.eql(
            JSON.parse(readDataFile(f)));

        var lines = readDataFile(f, 'txt').split('\n');
        lines.pop(); // trailing newline at EOF
        describeTree(t).must.eql(lines);
    }

    describe('constructor', function() {
        it('creates trees from objects', function() {
            assertTreeMatchesFile(
                'template-full');
        });

        it('can be called as a function', function() {
            var tree = Tree(JSON.parse(template));
            tree.__proto__.constructor.must.equal(Tree);
            assertTreeMatchesFile(
                Tree(JSON.parse(template)),
                'template-full');
        });

        it('creates empty trees', function() {
            assertTreeMatchesFile(
                new Tree(),
                'empty');
        });

        it('can be called on an existing tree', function() {
            assertTreeMatchesFile(
                new Tree(new Tree(newTree())),
                'template-full');
        });
    });

    describe('get method', function() {
        it('gets the root node', function() {
            tree.get([]).must.equal(tree);
        });

        it('gets the root node with no path', function() {
            tree.get().must.equal(tree);
        });

        it('gets the root node with a null path', function() {
            tree.get(null).must.equal(tree);
        });

        it('gets a subtree', function() {
            tree.get([1, 2]).must.equal(
                tree.children[1].children[2]);
        });

        it('cannot get a non-existent subtree', function() {
            (function() {
                tree.get([0, 3]);
            }).must.throw('Bad tree path [ 0, 3 ]: 3 (index 1) is above maximum value of 2.');
        });

        it('cannot get a numeric path', function() {
            (function() {
                tree.get(1);
            }).must.throw('Tree paths must be arrays.');
        });

        it('cannot get a string path', function() {
            (function() {
                tree.get('1');
            }).must.throw('Tree paths must be arrays.');
        });

        it('cannot get an object path', function() {
            (function() {
                tree.get({ '0' : 1 });
            }).must.throw('Tree paths must be arrays.');
        });

        it('cannot get a non-numeric path component', function() {
            (function() {
                tree.get(['asdf']);
            }).must.throw('Bad tree path [ asdf ]: asdf (index 0) is not a number.');
        });

        it('cannot get a floating-point path component', function() {
            (function() {
                tree.get([1, 1.1, 0]);
            }).must.throw('Bad tree path [ 1, 1.1, 0 ]: 1.1 (index 1) is not an integer.');
        });
    });

    describe('prepend method', function() {
        it('prepends nodes to the tree root', function() {
            tree.prepend([], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'prepend-root');
        });

        it('prepends nodes to the tree root with no path', function() {
            tree.prepend({ z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'prepend-root');
        });

        it('prepends nodes to an empty subtree', function() {
            tree.prepend([1, 0, 1], { z : 26 }).must.equal(1);
            assertTreeMatchesFile(
                'prepend-empty-subtree');
        });

        it('cannot prepend nodes to a non-existent subtree', function() {
            (function() {
                tree.prepend([3], { z : 26 });
            }).must.throw('Bad tree path [ 3 ]: 3 (index 0) is above maximum value of 1.');
        });
    });

    describe('insertBefore method', function() {
        it('inserts nodes as the first child of a subtree', function() {
            tree.insertBefore([1, 0, 0], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'insert-subtree-begin');
        });

        it('cannot insert nodes before child -1 of a subtree', function() {
            (function() {
                tree.insertBefore([1, 0, -1], { z : 26 });
            }).must.throw('Bad tree path [ 1, 0, -1 ]: -1 (index 2) is below minimum value of 0.');
        });

        it('cannot insert nodes before a non-existent subtree 1', function() {
            (function() {
                tree.insertBefore([0, 1, 0, 0], { z : 26 });
            }).must.throw('Bad tree path [ 0, 1, 0, 0 ]: 0 (index 2) refers to a non-existent element.');
        });

        it('cannot insert nodes before a non-existent subtree 2', function() {
            (function() {
                tree.insertBefore([1, 3, 0], { z : 26 });
            }).must.throw('Bad tree path [ 1, 3, 0 ]: 3 (index 1) is above maximum value of 2.');
        });

        it('inserts nodes in the middle of a subtree', function() {
            tree.insertBefore([0, 2], { z : 26 }).must.equal(4);
            assertTreeMatchesFile(
                'insert-subtree-middle');
        });

        it('inserts nodes as the last child of the root', function() {
            tree.insertBefore([2], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'insert-root-end');
        });

        it('cannot insert nodes before the last+1 child of the root', function() {
            (function() {
                tree.insertBefore([3], { z : 26 });
            }).must.throw('Bad tree path [ 3 ]: 3 (index 0) is above maximum value of 2.');
        });

        it('cannot insert nodes before the tree root', function() {
            (function() {
                tree.insertBefore([], { z : 26 });
            }).must.throw('Bad tree path [  ]: minimum length 1 not met.');
        });

        it('cannot insert nodes before the tree root with no path', function() {
            (function() {
                tree.insertBefore({ z : 26 });
            }).must.throw('Tree path is required for this operation.');
        });
    });

    describe('append method', function() {
        it('appends nodes to the tree root', function() {
            tree.append([], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'append-root');
        });

        it('appends nodes to the tree root with no path', function() {
            tree.append({ z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'append-root');
        });

        it('appends nodes to a non-empty subtree', function() {
            tree.append([1, 0], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'append-non-empty');
        });

        it('cannot append nodes to a non-existent subtree', function() {
            (function() {
                tree.append([0, -1], { z : 26 });
            }).must.throw('Bad tree path [ 0, -1 ]: -1 (index 1) is below minimum value of 0.');
        });
    });

    describe('insertAfter method', function() {
        it('inserts nodes as the first child of a subtree', function() {
            tree.insertAfter([1, 0, -1], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'insert-subtree-begin');
        });

        it('cannot insert nodes after child -2 of a subtree', function() {
            (function() {
                tree.insertAfter([1, 0, -2], { z : 26 });
            }).must.throw('Bad tree path [ 1, 0, -2 ]: -2 (index 2) is below minimum value of -1.');
        });

        it('cannot insert nodes after a non-existent subtree 1', function() {
            (function() {
                tree.insertAfter([0, 1, -1, 0], { z : 26 });
            }).must.throw('Bad tree path [ 0, 1, -1, 0 ]: -1 (index 2) refers to a non-existent element.');
        });

        it('cannot insert nodes after a non-existent subtree 2', function() {
            (function() {
                tree.insertAfter([1, -1, 0], { z : 26 });
            }).must.throw('Bad tree path [ 1, -1, 0 ]: -1 (index 1) is below minimum value of 0.');
        });

        it('inserts nodes in the middle of a subtree', function() {
            tree.insertAfter([0, 1], { z : 26 }).must.equal(4);
            assertTreeMatchesFile(
                'insert-subtree-middle');
        });

        it('inserts nodes as the last child of the root', function() {
            tree.insertAfter([1], { z : 26 }).must.equal(3);
            assertTreeMatchesFile(
                'insert-root-end');
        });

        it('cannot insert nodes after the last child of the root', function() {
            (function() {
                tree.insertAfter([2], { z : 26 });
            }).must.throw('Bad tree path [ 2 ]: 2 (index 0) is above maximum value of 1.');
        });

        it('cannot insert nodes before the tree root', function() {
            (function() {
                tree.insertAfter([], { z : 26 });
            }).must.throw('Bad tree path [  ]: minimum length 1 not met.');
        });

        it('cannot insert nodes before the tree root with no path', function() {
            (function() {
                tree.insertAfter({ z : 26 });
            }).must.throw('Tree path is required for this operation.');
        });
    });

    describe('remove method', function() {
        it('removes nodes at the beginning of a tree', function() {
            var node = tree.children[0];
            tree.remove([0]).must.equal(node);
            node.children.must.have.length(0);
            assertTreeMatchesFile(
                'remove-0');
        });

        it('removes nodes in the middle of a subtree', function() {
            var node = tree.get([1, 1]);
            tree.remove([1, 1]).must.equal(node);
            node.children.must.have.length(0);
            assertTreeMatchesFile(
                'remove-1-1');
        });

        it('removes nodes at the end of a subtree', function() {
            var node = tree.get([1, 2, 2]);
            tree.remove([1, 2, 2]).must.equal(node);
            node.children.must.have.length(0);
            assertTreeMatchesFile(
                'remove-1-2-2');
        });

        it('cannot remove the root node', function() {
            (function() {
                tree.remove([]);
            }).must.throw('Bad tree path [  ]: minimum length 1 not met.');
        });

        it('cannot remove the root node with no path', function() {
            (function() {
                tree.remove();
            }).must.throw('Tree path is required for this operation.');
        });

        it('cannot remove a non-existent subtree', function() {
            (function() {
                tree.remove([0, 3, 0]);
            }).must.throw('Bad tree path [ 0, 3, 0 ]: 3 (index 1) is above maximum value of 2.');
        });
    });

    describe('prune method', function() {
        it('prunes nodes at the beginning of a tree', function() {
            var node = tree.children[0];
            tree.prune([0]).must.equal(node);
            assertTreeMatchesFile(
                'prune-0');
        });

        it('prunes nodes in the middle of a subtree', function() {
            var node = tree.get([1, 1]);
            tree.prune([1, 1]).must.equal(node);
            assertTreeMatchesFile(
                'prune-1-1');
        });

        it('prunes nodes at the end of a subtree', function() {
            var node = tree.get([1, 2, 2]);
            tree.prune([1, 2, 2]).must.equal(node);
            assertTreeMatchesFile(
                'prune-1-2-2');
        });

        it('cannot prune the root node', function() {
            (function() {
                tree.prune([]);
            }).must.throw('Bad tree path [  ]: minimum length 1 not met.');
        });

        it('cannot prune the root node with no path', function() {
            (function() {
                tree.prune();
            }).must.throw('Tree path is required for this operation.');
        });

        it('cannot prune a non-existent subtree', function() {
            (function() {
                tree.prune([0, 3, 0]);
            }).must.throw('Bad tree path [ 0, 3, 0 ]: 3 (index 1) is above maximum value of 2.');
        });
    });

    describe('walk method', function() {
        // Basic usage of walk() is already pretty well-tested (see
        // describeTree() above).

        it('returns the count of all nodes', function() {
            tree.walk([]).must.equal(16);
        });

        it('returns the count of all nodes with no path', function() {
            tree.walk().must.equal(16);
        });

        it('returns the count of all nodes given only a function', function() {
            var n = 0;
            tree.walk(function() {
                n++;
            }).must.equal(16);
            n.must.equal(16);
        });

        it('walks subtrees', function() {
            var paths = [];
            tree.walk([1], function(path, node) {
                paths.push(path.join(','));
            }).must.equal(11);
            paths.must.eql([
                '1',
                '1,0',
                '1,0,0',
                '1,0,1',
                '1,1',
                '1,1,0',
                '1,1,1',
                '1,2',
                '1,2,0',
                '1,2,1',
                '1,2,2'
            ]);
        });

        it('does nothing if the first callback returns false', function() {
            var n = 0;
            tree.walk(function(path, node) {
                n++;
                path.must.eql([]);
                return false;
            }).must.equal(1);
            n.must.equal(1);
        });

        it('stops walking subtrees if the callback returns false', function() {
            var paths = [];
            tree.walk(function(path, node) {
                var pathStr = path.join(',');
                paths.push(pathStr);
                if (pathStr === '0' || pathStr === '1,1' || pathStr === '1,2,1') {
                    return false;
                }
            }).must.equal(11);
            paths.must.eql([
                '',
                '0',
                '1',
                '1,0',
                '1,0,0',
                '1,0,1',
                '1,1',
                '1,2',
                '1,2,0',
                '1,2,1',
                '1,2,2'
            ]);
        });
    });

    describe('keys method', function() {
        it('works on the root node', function() {
            tree.keys([]).must.eql(['a', 'b']);
        });

        it('works on the root node with no path', function() {
            tree.keys().must.eql(['a', 'b']);
        });

        it('works on a non-empty descendant node', function() {
            tree.keys([0, 2]).must.eql(['g']);
        });

        it('works on an empty child node', function() {
            tree.append([], {});
            tree.keys([2]).must.eql([]);
        });
    });
});
