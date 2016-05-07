import check, { assert } from 'check-types';

import boundary from './../structs/boundary.js';
import node from './../structs/node.js';

const Node = (function Node() {
  function addChild(n, item) {
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
  }

  function addOverlappingChild(n, item) {
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
  }

  function split(n) {
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
  }

  function isLeaf(n) {
    // n is a leaf when its quadrants haven't been set
    assert(
      n.has('quadrants'),
      'Missing quadrants property'
    );

    return check.null(n.get('quadrants').get('top-left'));
  }

  function clear(n) {
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
  }

  function isSplittable(n) {
    // A node is splittable when:
    //   it has more than the maximum number of children and
    //   it is below the max depth
    check.assert(
      check.all(['quadrants', 'depth', 'maxDepth', 'maxChildren'].map((key) => n.has(key))),
      'Missing node properties'
    );

    const len = n.get('children').count();

    return len > n.get('maxChildren') && n.get('depth') < n.get('maxDepth');
  }

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
