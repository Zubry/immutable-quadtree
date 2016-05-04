# Efficient Collision Detection with Quadtrees

## Introduction

Quadtrees are, as the name suggests, tree-shaped data structures in which each node has 4 child nodes. For the purpose of collision detection, we let each of the 4 nodes represent a quadrant of a coordinate plane. We then let each node contain a list of items within its quadrant. When the list of items grows too long, the node is split into 4 quadrants, and its items are redistributed among them. This allows for us to recursively search the tree for items within a boundary. Performance-wise, this process is vastly superior to alternative implementations, such as search a 2D array.

There are other implementations for quadtrees in JavaScript, such as those by [Mike Chambers](http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/) and [Silflow](https://github.com/silflow/quadtree-javascript), but there is still ground to be broken. In particular, I aim to create an *immutable* quadtree implementation.

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

## Building and Testing

### To download and install

    $ git clone https://github.com/Zubry/immutable-quadtree.git
    $ cd immutable-quadtree
    $ npm install

### To build

    $ npm run-script lint
    $ npm run-script build

### To test

    $ npm run-script test

or

    $ npm test
