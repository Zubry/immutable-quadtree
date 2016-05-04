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
