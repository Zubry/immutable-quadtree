import {assert} from 'chai';
import should from 'should';

import boundary from './../lib/structs/boundary.js';
import Boundary from './../lib/modules/boundary.js';

'use strict';

describe('Boundary', function(){
  describe('Struct', function(){
    it('should not accept invalid types', function(){
      (function(){
        boundary(0, 0, 0, '');
      }).should.throw();

      (function(){
        boundary(0, 0, '', 0);
      }).should.throw();

      (function(){
        boundary(0, '', 0, 0);
      }).should.throw();

      (function(){
        boundary('', 0, 0, 0);
      }).should.throw();
    });

    it('should store boundaries', function(){
      const b = boundary(5, 6, 10, 12);

      b.get('x').should.equal(5);
      b.get('y').should.equal(6);
      b.get('width').should.equal(10);
      b.get('height').should.equal(12);
    });

    it('should default to (0, 0)', function(){
      const b = boundary();

      b.get('x').should.equal(0);
      b.get('y').should.equal(0);
      b.get('width').should.equal(0);
      b.get('height').should.equal(0);
    });
  });

  describe('Module', function(){
    it('should check if one boundary is within another', function(){
      const b1 = boundary(1, 1, 120, 120);
      const b2 = boundary(5, 5, 10, 10);
      const b3 = boundary(110, 110, 30, 30);

      Boundary.within(b1, b2).should.be.true();
      // Boundary.within(b1, b3).should.be.false();
      // Boundary.within(b2, b1).should.be.false();
      // Boundary.within(b2, b3).should.be.false();
    });
  });
});
