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
                keys = node.keys();
            if (path.length) {
                line += path.join(',');
            } else {
                line += '[]';
            }
            line += '\t: ';
            if (keys.length) {
                line += node.keys().map(function(k) {
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

    describe('prepend', function() {
        it('prepends nodes to the tree root', function() {
            tree.prepend([], { z : 26 });
            assertTreeMatchesFile(
                'prepend-root');
        });

        it('prepends nodes to an empty subtree', function() {
            tree.prepend([1, 0, 1], { z : 26 });
            assertTreeMatchesFile(
                'prepend-empty-subtree');
        });

        it('cannot prepend nodes to a non-existent subtree', function() {
            (function() {
                tree.prepend([3], { z : 26 });
            }).must.throw('Bad tree path [ 3 ]: 3 (index 0) is above maximum value of 1.');
        });
    });

    describe('insertBefore', function() {
        it('inserts nodes as the first child of a subtree', function() {
            tree.insertBefore([1, 0, 0], { z : 26 });
            assertTreeMatchesFile(
                'insertBefore-subtree-begin');
        });

        it('cannot insert nodes before child -1 of a subtree', function() {
            (function() {
                tree.insertBefore([1, 0, -1], { z : 26 });
            }).must.throw('Bad tree path [ 1, 0, -1 ]: -1 (index 2) is below minimum value of 0.');
        });

        it('inserts nodes in the middle of a subtree', function() {
            tree.insertBefore([0, 2], { z : 26 });
            assertTreeMatchesFile(
                'insertBefore-subtree-middle');
        });

        it('inserts nodes as the last child of the root', function() {
            tree.insertBefore([2], { z : 26 });
            assertTreeMatchesFile(
                'insertBefore-root-end');
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
    });
});
