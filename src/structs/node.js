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
}

export default node;
