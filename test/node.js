import {assert} from 'chai';
import should from 'should';

import position from './../lib/structs/position.js';
import boundary from './../lib/structs/boundary.js';
import node from './../lib/structs/node.js';
import Node from './../lib/modules/node.js';

'use strict';

describe('Node', function(){
  describe('Struct', function(){
    it('should not accept invalid types', function(){
      const b = boundary(0, 0, 50, 50);

      (function(){
        node(b, 0, 0, '');
      }).should.throw();

      (function(){
        node(b, 0, '', 0);
      }).should.throw();

      (function(){
        node(b, '', 0, 0);
      }).should.throw();

      (function(){
        node({}, 0, 0, 0);
      }).should.throw();
    });

    it('should accept boundary, maxChildren, maxDepth, and depth parameters', function(){
      const b = boundary(0, 0, 50, 50);

      const n = node(b, 4, 5, 2);

      n.get('boundary').should.equal(b);
      n.get('maxChildren').should.equal(4);
      n.get('maxDepth').should.equal(5);
      n.get('depth').should.equal(2);
    });

    it('should default to (b, 4, 4, 0)', function(){
      const b = boundary(0, 0, 50, 50);
      const n = node(b);

      n.get('maxChildren').should.equal(4);
      n.get('maxDepth').should.equal(4);
      n.get('depth').should.equal(0);
    });
  });

  describe('Module', function(){
    it('should add children', function(){
      const b = boundary(10, 10, 1, 2);
      const n = node(b, 4, 5, 2);

      Node.addChild(n, b).get('children').count().should.equal(1);
    });

    it('should not add children that do not have boundaries', function(){
      const p = position(10, 10);
      const b = boundary(10, 10, 1, 2);
      const n = node(b, 4, 5, 2);

      (function(){
        Node.addChild(n, p)
      }).should.throw();
    });

    it('should add overlapping children', function(){
      const b = boundary(10, 10, 1, 2);
      const n = node(b, 4, 5, 2);

      Node.addOverlappingChild(n, b).get('overlappingChildren').count().should.equal(1);
    });

    it('should not add overlapping children that do not have boundaries', function(){
      const p = position(10, 10);
      const b = boundary(10, 10, 1, 2);
      const n = node(b, 4, 5, 2);

      (function(){
        Node.addOverlappingChild(n, p)
      }).should.throw();
    });

    it('should split nodes into 4 subquadrants', function(){
      const b = boundary(0, 0, 100, 100);
      const n = node(b, 4, 5, 2);

      const split = Node.split(n);

      split.has('quadrants').should.equal(true);
      const quadrants = split.get('quadrants');

      quadrants.has('top-left').should.equal(true);
      quadrants.has('top-right').should.equal(true);
      quadrants.has('bottom-left').should.equal(true);
      quadrants.has('bottom-right').should.equal(true);
    });

    it('should assign correct dimensions to each subquadrant', function(){
        const b = boundary(0, 0, 100, 100);
        const n = node(b, 4, 5, 2);

        const split = Node.split(n);

        split.has('quadrants').should.equal(true);
        const quadrants = split.get('quadrants');

        quadrants.get('top-left').get('boundary').get('x').should.equal(0);
        quadrants.get('top-left').get('boundary').get('y').should.equal(0);
        quadrants.get('top-left').get('boundary').get('width').should.equal(50);
        quadrants.get('top-left').get('boundary').get('height').should.equal(50);

        quadrants.get('top-right').get('boundary').get('x').should.equal(50);
        quadrants.get('top-right').get('boundary').get('y').should.equal(0);
        quadrants.get('top-right').get('boundary').get('width').should.equal(50);
        quadrants.get('top-right').get('boundary').get('height').should.equal(50);

        quadrants.get('bottom-left').get('boundary').get('x').should.equal(0);
        quadrants.get('bottom-left').get('boundary').get('y').should.equal(50);
        quadrants.get('bottom-left').get('boundary').get('width').should.equal(50);
        quadrants.get('bottom-left').get('boundary').get('height').should.equal(50);

        quadrants.get('bottom-right').get('boundary').get('x').should.equal(50);
        quadrants.get('bottom-right').get('boundary').get('y').should.equal(50);
        quadrants.get('bottom-right').get('boundary').get('width').should.equal(50);
        quadrants.get('bottom-right').get('boundary').get('height').should.equal(50);

    });
  })
});
