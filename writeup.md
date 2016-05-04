# Efficient Collision Detection with Quadtrees

## Introduction

Quadtrees are, as the name suggests, tree-shaped data structures in which each node has 4 child nodes. For the purpose of collision detection, we let each of the 4 nodes represent a quadrant of a coordinate plane. We then let each node contain a list of items within its quadrant. When the list of items grows too long, the node is split into 4 quadrants, and its items are redistributed among them. This allows for us to recursively search the tree for items within a boundary. Performance-wise, this process is vastly superior to alternative implementations, such as search a 2D array.

There are other implementations for quadtrees in JavaScript, such as those by [Mike Chambers](http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/) and [Silflow](https://github.com/silflow/quadtree-javascript), but there is still ground to be broken. In particular, I aim to create an *immutable* quadtree implementation.

## API

Fundamentally, quadtrees have only two operations: `insert(node, item)` and `search(node, boundary)`. To make our tree a little easier to use, however, we'll add `create()` and `clear(node)` methods.

We'll also need to create three data structures, `Position`, `Boundary`, and `Node`:

### Position

 * `number x`
 * `number y`

### Boundary

 **extends** `Position`

 * `number width`
 * `number height`

### Node

 * `Record[Node] quadrants`
 * `list[Boundary] children`
 * `list[Boundary] overlappingChildren // Children that fit into multiple subquadrants`
 * `int maxChildren`
 * `int maxDepth`
 * `int depth`
 * `Boundary boundary`

## The Code

Let's start by writing the code to generate our data structures. As always, I use [immutable.js](https://facebook.github.io/immutable-js/) and [check-types](https://www.npmjs.com/package/check-types#number-predicates).

### /structs/position.js

This struct just stores `x` and `y` coordinates.
In the future, we might add a `z` property to allow for multi-level buildings.
Default values for `x` and `y` are 0.
Because we want to allow for fractional coordinates, we assert that `x` and `y` are **numbers**, not integers.

```javascript
import { Map as map } from 'immutable';
import { assert } from 'check-types';

function position(x = 0, y = 0) {
  assert.number(x);
  assert.number(y);

  return map({
    x,
    y,
  });
};

export default position;
```

### /structs/boundary.js

We define a boundary as a position plus a width and a height. Like `x` and `y`, `width` and `height` should default to 0 and they should both be numbers, not integers.

For those not familiar with map composition, we only concern ourselves with the properties unique to boundaries: `width` and `height`. We merge the `{ height, width }` map with a position struct to create a boundary. We don't check if the position struct's parameters are correct--it'll handle it for us.

```javascript
import { Map as map } from 'immutable';
import { assert } from 'check-types';

import position from './position.js';

function boundary(x, y, width = 0, height = 0) {
  assert.number(width);
  assert.number(height);

  return map({ width, height })
    .merge(position(x, y));
};

export default boundary;
```

### /structs/node.js

Nodes are more complicated than boundaries. First and foremost, we accept 4 parameters. Boundary defines the coordinate plane that our node covers. MaxChildren determines how many items we can store in our node before we have to split it. MaxDepth determines how deep our tree can reach. Depth is the current depth of the node.

The boundary parameter should be required. MaxChildren and MaxDepth should have reasonable defaults (I chose 4 for both), and depth should default to 0. The latter 3 should be integers, and boundary should have x, y, width, and height properties.

We also need to set some "internal" properties. From those coming from an OO background, these would likely be private. We define a quadrants record, which has 'top-left', 'top-right', 'bottom-left', 'bottom-right' properties. We also define a list of children and a list of overlapping children, which represents children that would fit in multiple nodes.

```javascript
import { Map as map, List as list } from 'immutable';
import check, { assert } from 'check-types';

function node(boundary, maxChildren = 4, maxDepth = 4, depth = 0) {
  assert(
    check.all(['x', 'y', 'width', 'height'].map((key) => boundary.has(key))),
    'Missing boundary'
  );

  assert.integer(maxChildren);
  assert.greater(maxChildren, 0);
  assert.integer(maxDepth);
  assert.greater(maxDepth, 0);
  assert.integer(depth);
  assert.greaterOrEqual(depth, 0);

  const quadrants = map({
    'top-left': null,
    'top-right': null,
    'bottom-left': null,
    'bottom-right': null,
  });

  const children = list();
  const overlappingChildren = list();

  return map({ boundary, maxChildren, maxDepth, depth, quadrants, children, overlappingChildren });
};

export default node;
```

### /modules/boundary.js

Now that our data structures are all set, we can work on the functions that manipulate them.

First, let's create the boundary module. We need two methods: `within(bound, item)`, which checks if bound `fully` contains `item`, and `intersects(bound1, bound2)`, which checks if `bound1` and `bound2` intersect each other.

```javascript
import check from 'check-types';

const Boundary = (function Boundary() {
  function within(bound, item) {
    check.assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => bound.has(key)))
    , 'Missing boundary');
    check.assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => item.has(key)))
    , 'Missing boundary');

    return (
      item.get('x') >= bound.get('x') &&
      item.get('x') + item.get('width') <= bound.get('x') + bound.get('width') &&
      item.get('y') >= bound.get('y') &&
      item.get('y') + item.get('height') <= bound.get('y') + bound.get('height')
    );
  }

  function intersects(bound1, bound2) {
    check.assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => bound1.has(key)))
    , 'Missing boundary');
    check.assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => bound2.has(key)))
    , 'Missing boundary');

    return (
      bound1.get('x') < bound2.get('x') + bound2.get('width') &&
      bound1.get('x') + bound1.get('width') > bound2.get('x') &&
      bound1.get('y') < bound2.get('y') + bound2.get('height') &&
      bound1.get('y') + bound1.get('height') > bound2.get('y')
    );
  }

  return {
    within,
    intersects,
  };
}());

export default Boundary;
```

### /modules/node.js

Nodes have several operations. First, we need to be able to add children and overlapping children. We'll also want a method to split the node into 4 subquadrants. Additionally, we'll want a way to clear the node. Finally, we have to check if a node is a leaf (i.e. it has no subquadrants) and if we're able to split it.

```javascript
import check, { assert } from 'check-types';

import boundary from './../structs/boundary.js';
import node from './../structs/node.js';

const Node = (function Node() {
  const addChild = function addChild(n, item) {
    assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => item.has(key))),
      'Missing boundary'
    );

    assert(
      n.has('children'),
      'Missing children property'
    );

    return n
      .update('children', (l) => l.push(item));
  };

  const addOverlappingChild = function addOverlappingChild(n, item) {
    assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => item.has(key))),
      'Missing boundary'
    );

    assert(
      n.has('overlappingChildren'),
      'Missing overlappingChildren property'
    );

    return n
      .update('overlappingChildren', (l) => l.push(item));
  };

  const split = function split(n) {
    assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => n.get('boundary').has(key))),
      'Missing boundary'
    );

    assert(
      check.all(['quadrants', 'depth', 'maxDepth', 'maxChildren'].map((key) => n.has(key))),
      'Missing node properties'
    );

    const { x, y, width, height } = n.get('boundary').toObject();

    const halfwidth = width / 2;
    const halfheight = height / 2;
    const hmid = x + halfwidth;
    const vmid = y + halfheight;
    const depth = n.get('depth') + 1;

    return n
      .update('quadrants', (q) => (
        q
          .set('top-left', node(boundary(
            x,
            y,
            halfheight,
            halfwidth
          ), n.get('maxChildren'), n.get('maxDepth'), depth))
          .set('top-right', node(boundary(
            hmid,
            y,
            halfheight,
            halfwidth
          ), n.get('maxChildren'), n.get('maxDepth'), depth))
          .set('bottom-left', node(boundary(
            x,
            vmid,
            halfheight,
            halfwidth
          ), n.get('maxChildren'), n.get('maxDepth'), depth))
          .set('bottom-right', node(boundary(
            hmid,
            vmid,
            halfheight,
            halfwidth
          ), n.get('maxChildren'), n.get('maxDepth'), depth))
      ));
  };

  const isLeaf = function isLeaf(n) {
    // n is a leaf when its quadrants haven't been set
    assert(
      n.has('quadrants'),
      'Missing quadrants property'
    );

    return check.null(n.get('quadrants').get('top-left'));
  };

  const clear = function clear(n) {
    let removedNodes = n;

    // If the node has quadrants,
    //   for each quadrant, clear the quadrant
    if (!isLeaf(n)) {
      removedNodes = n
        .update('quadrants', (q) => (q.map((l) => clear(l))))
        .update('quadrants', (q) => (q.map(() => null)));
    }

    // Lastly, clear the children and overlappingChildren lists
    return removedNodes
      .update('children', (l) => l.clear())
      .update('overlappingChildren', (l) => l.clear());
  };

  const isSplittable = function isSplittable(n) {
    // A node is splittable when:
    //   it has more than the maximum number of children and
    //   it is below the max depth
    check.assert(
      check.all(['quadrants', 'depth', 'maxDepth', 'maxChildren'].map((key) => n.has(key))),
      'Missing node properties'
    );

    const len = n.get('children').count();

    return len > n.get('maxChildren') && n.get('depth') < n.get('maxDepth');
  };

  return {
    addChild,
    addOverlappingChild,
    split,
    clear,
    isLeaf,
    isSplittable,
  };
}());

export default Node;
```

### /modules/quadtree.js

Finally, we can put it all together. The Quadtree module, like we mentioned earlier, has `create`, `insert`, `search`, and `clear` `methods`. All of these methods should accept a quadtree as the first parameter and returned a modified copy of it.

The process of insertion is as follows: if the node is a leaf, add the item as a child, and split it if necessary. If it is not a leaf, figure out which quadrant the item belongs in, and insert it into that node.

The process of searching is as follows: if the item is within the node's boundary, return all direct children that intersect it, then repeat the search on each subquadrant.

```javascript
import check, { assert } from 'check-types';
import { List as list } from 'immutable';

import Node from './node.js';
import Boundary from './boundary.js';
import node from './../structs/node.js';

const Quadtree = (function Quadtree() {
  function create(boundary, maxChildren = 4, maxDepth = 4) {
    return node(boundary, maxChildren, maxDepth, 0);
  }

  function determineQuadrant(n, item) {
    const b = n.get('boundary');

    const right = item.get('x') > b.get('x') + b.get('width') / 2;
    const left = !right;
    const bottom = item.get('y') > b.get('y') + b.get('height') / 2;
    const top = !bottom;

    if (top && left) {
      return 'top-left';
    }

    if (top && right) {
      return 'top-right';
    }

    if (bottom && left) {
      return 'bottom-left';
    }

    if (bottom && right) {
      return 'bottom-right';
    }

    return '';
  }

  function insert(n, item) {
    assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => item.has(key))),
      'Missing boundary'
    );

    assert(
      check.all(
        ['boundary', 'quadrants', 'depth', 'maxDepth', 'maxChildren']
          .map((key) => n.has(key))
      ),
      'Missing node properties'
    );

    if (!Node.isLeaf(n)) {
      const direction = determineQuadrant(n, item);
      const quadrant = n.get('quadrants').get(direction);

      if (Boundary.within(quadrant.get('boundary'), item)) {
        return n.update('quadrants', (q) => q.update(direction, (d) => insert(d, item)));
      }

      return Node.addOverlappingChild(n, item);
    }

    const updatedNode = Node.addChild(n, item);

    if (!Node.isSplittable(updatedNode)) {
      return updatedNode;
    }

    const splitNode = Node.split(updatedNode);

    const children = splitNode.get('children');

    return children
      .reduce((acc, i) => insert(acc, i), splitNode)
      .update('children', (l) => l.clear());
  }

  function batchInsert(n, items) {
    return items.reduce((acc, item) => insert(acc, item), n);
  }

  function search(n, item) {
    assert(
      check.all(['x', 'y', 'width', 'height'].map((key) => item.has(key))),
      'Missing boundary'
    );

    assert(
      check.all(
        ['boundary', 'quadrants', 'depth', 'maxDepth', 'maxChildren']
          .map((key) => n.has(key))
      ),
      'Missing node properties'
    );

    if (!Boundary.intersects(n.get('boundary'), item)) {
      return list();
    }

    const points = n
      .get('children')
      .concat(n.get('overlappingChildren'))
      .filter((x) => Boundary.intersects(item, x));

    if (Node.isLeaf(n)) {
      return points;
    }

    const quadrants = n.get('quadrants');

    return points
      .concat(search(quadrants.get('top-left'), item))
      .concat(search(quadrants.get('top-right'), item))
      .concat(search(quadrants.get('bottom-left'), item))
      .concat(search(quadrants.get('bottom-right'), item));
  }

  function clear(n) {
    if (check.null(n)) {
      return null;
    }

    assert(
      check.all(
        ['boundary', 'quadrants', 'depth', 'maxDepth', 'maxChildren']
          .map((key) => n.has(key))
      ),
      'Missing node properties'
    );

    const clearList = (l) => l.clear();

    return n
      .update('children', clearList)
      .update('overlappingChildren', clearList)
      .update('quadrants', (q) => (
        q
          .update('top-left', clear)
          .update('top-right', clear)
          .update('bottom-left', clear)
          .update('bottom-right', clear)
          .set('top-left', null)
          .set('top-right', null)
          .set('bottom-left', null)
          .set('bottom-right', null)
      ));
  }

  return {
    create,
    insert,
    search,
    clear,
    batchInsert,
  };
}());

export default Quadtree;
```

## Usage

### Creating a quadtree

```javascript
// Create a 200x200 coordinate plane
const range = boundary(0, 0, 200, 200);
let quadtree = Quadtree.create(range);
```

### Inserting items

```javascript
// Items must have x, y, width, and height properties
// So they should be boundaries
// Or something composed with boundaries
const item = boundary(5, 6, 1, 2);
quadtree = Quadtree.insert(quadtree, item);
```

```javascript
// You can also batch insert items
const items = [
  boundary(5, 6, 1, 2),
  boundary(67, 24, 1, 1),
  boundary(149, 121, 2, 1),
  boundary(189, 76, 1, 1),
  boundary(25, 195, 1, 2),
  boundary(99, 0, 5, 2),
  boundary(64, 120, 5, 7),
  boundary(112, 57, 2, 2),
  boundary(49, 49, 2, 2)
];

quadtree = Quadtree.batchInsert(quadtree, items);
```

### Searching

```javascript
const range = boundary(0, 0, 200, 200);
const viewport = boundary(50, 50, 100, 100);

let quadtree = Quadtree.create(range);

const items = [
  boundary(5, 6, 1, 2),
  boundary(67, 24, 1, 1),
  boundary(149, 121, 2, 1),
  boundary(189, 76, 1, 1),
  boundary(25, 195, 1, 2),
  boundary(99, 0, 5, 2),
  boundary(64, 120, 5, 7),
  boundary(112, 57, 2, 2),
  boundary(49, 49, 2, 2)
];

quadtree = Quadtree.batchInsert(quadtree, items);

// [boundary(149, 121, 2, 1), boundary(64, 120, 5, 7), boundary(112, 57, 2, 2), boundary(49, 49, 2, 2)]
const results = Quadtree.search(quadtree, viewport);
```

### Clearing

```javascript
quadtree = Quadtree.clear(quadtree);
```
