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
