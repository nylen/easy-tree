# easy-tree

[![Build status](https://img.shields.io/travis/nylen/easy-tree.svg?style=flat)](https://travis-ci.org/nylen/easy-tree)
[![npm package](http://img.shields.io/npm/v/easy-tree.svg?style=flat)](https://www.npmjs.org/package/easy-tree)

This simple Node.js module provides an easy way to manipulate tree data
structures.

## Usage

Require the module and create a `Tree` object:

```js
var Tree = require('easy-tree');

// Create an empty tree
var tree = new Tree();

// Create a tree from an arbitrary data object
var tree = new Tree({
    a : 1,
    b : 2
});

// Create a tree with several children from an array
var tree = new Tree([
    { a : 1 },
    { b : 2 }
]);

// Create a multi-level tree using the `children` property
var tree = new Tree({
    a : 1,
    b : 2,
    children : [
        { c : 3 },
        { d : 4 }
    ]
});

// If you're not a fan of `new`
var tree = Tree();
```

A `Tree` object represents a tree node.  Tree nodes must be JavaScript objects.
They can have any data attributes that do not conflict with `Tree` object
method names, and one or more children, which are stored in the `children`
array.

You can use `tree.children[i]` and `tree.children.length` to retrieve and count
children, but **do not manipulate the `children` array directly!** Instead, use
the following methods to safely and correctly perform operations on the tree:

## Methods

Most methods take a `path` argument which is an array of 0-based indices that
point to a tree node.  Omit the `path` argument or use `[]` to perform the
operation on the current node, but this is not valid for all operations:  a
tree node cannot remove itself, or insert a node before or after itself,
because it doesn't know its own parent.

Many methods take a `child` argument, which can be either a `Tree` instance or
a plain object which will be converted to a `Tree` instance.

### tree.get([path])

Returns the subtree at `path` (or the tree itself, if `path` is `[]` or
omitted).

### tree.prepend([path], child)

Insert `child` as the first child of the node given by `path`.

Returns the new number of children of the modified node.

### tree.insertBefore(path, child)

Insert `child` before the node given by `path`.

`path` cannot be omitted and must contain at least 1 element.

Returns the new number of children of the modified node.

### tree.append([path], child)

Insert `child` as the last child of the node given by `path`.

Returns the new number of children of the modified node.

### tree.insertAfter(path, child)

Insert `child` after the node given by `path`.

`path` cannot be omitted and must contain at least 1 element.

Returns the new number of children of the modified node.

### tree.remove(path)

Removes the node specified by `path`, and **inserts each of its children where
the removed node used to be**.

`path` cannot be omitted and must contain at least 1 element.

Returns the removed node (without any children).

### tree.prune(path)

Removes the entire subtree beginning with the node specified by `path`.

`path` cannot be omitted and must contain at least 1 element.

Returns the removed node and all its children.

### tree.keys([path])

Returns an array of all data attributes in the node specified by `path` (same
as `Object.keys()` but excludes the `children` property).

### tree.walk([path], [cb])

For the node specified by `path` and any child and descendant nodes, calls `cb`
**synchronously** with parameters `path, node`.

Returns the total number of nodes visited.

You can omit the `cb` parameter to just count the number of nodes in a tree.

If `cb` returns `false` for a given node, the `walk` function will not descend
to that node's children and they will not be included in the count of nodes
visited.

## Other Notes

`Tree` objects also contain the following private methods, so you cannot use
any of these names as data attributes:

- `_doAtPath`
- `_makeTree`
- `_throwPathError`
- `_walk`

Saving tree data to JSON and restoring it later works just fine:

```js
var myTree = new Tree({ ... });

var savedData = JSON.stringify(myTree);

myTree = new Tree(JSON.parse(savedData));
```
