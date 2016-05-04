import {assert} from 'chai';
import should from 'should';

import Quadtree from './../src/modules/quadtree.js';

import boundary from './../src/structs/boundary.js';

'use strict';

describe('Quadtree', function(){
  describe('Module', function(){
    it('should generate a node', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      ['boundary', 'quadrants', 'depth', 'maxDepth', 'maxChildren']
        .map((key) => quadtree.has(key))
        .filter((v) => !v)
        .length
        .should
        .equal(0);
    });

    it('should add children to the tree', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      const item = boundary(5, 5, 2, 1);

      Quadtree.insert(quadtree, item)
        .get('children')
        .count()
        .should
        .equal(1);
    });

    it('should split when more than the specified number of items have been added', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      const items = [
        boundary(5, 6, 1, 2),
        boundary(67, 24, 1, 1),
        boundary(153, 121, 2, 1),
        boundary(189, 76, 1, 1),
        boundary(25, 195, 1, 2)
      ];


      const newtree = items.reduce((acc, item) => Quadtree.insert(acc, item), quadtree);

      newtree.get('children').count().should.equal(0);
      newtree.get('quadrants').get('top-left').should.not.be.null();
    });

    it('should handle overlapping items correctly when splitting', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      const items = [
        boundary(5, 6, 1, 2),
        boundary(67, 24, 1, 1),
        boundary(153, 121, 2, 1),
        boundary(189, 76, 1, 1),
        boundary(25, 195, 1, 2),
        boundary(99, 0, 5, 2)
      ];

      const newtree = items.reduce((acc, item) => Quadtree.insert(acc, item), quadtree);

      newtree.get('overlappingChildren').count().should.equal(1);
      newtree.get('quadrants').get('top-left').should.not.be.null();
    });

    it('should search for all points within a range', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      const searchRange = boundary(50, 50, 100, 100);

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

      const newtree = items.reduce((acc, item) => Quadtree.insert(acc, item), quadtree);

      const results = Quadtree.search(newtree, searchRange);

      results.count().should.equal(4);
    });

    it('should be possible to clear a quadtree', function(){
      const viewport = boundary(0, 0, 200, 200);
      const quadtree = Quadtree.create(viewport);

      const searchRange = boundary(50, 50, 100, 100);

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

      const newTree = Quadtree.batchInsert(quadtree, items);

      const cleared = Quadtree.clear(newTree);

      cleared.get('children').count().should.equal(0);
      cleared.get('overlappingChildren').count().should.equal(0);
      should.not.exist(cleared.get('quadrants').get('top-left'));
      cleared.get('depth').should.equal(0);
    });
  });
});
