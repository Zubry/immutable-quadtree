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
