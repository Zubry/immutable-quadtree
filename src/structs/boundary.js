import { Map as map } from 'immutable';
import { assert } from 'check-types';

import position from './position.js';

function boundary(x, y, width = 0, height = 0) {
  assert.number(width);
  assert.number(height);

  return map({ width, height })
    .merge(position(x, y));
}

export default boundary;
