import {assert} from 'chai';
import should from 'should';

import position from './../lib/structs/position.js';

'use strict';

describe('Position', function(){
  describe('Struct', function(){
    it('should not accept invalid types', function(){
      (function(){
        position(0, '');
      }).should.throw();

      (function(){
        position('', 0);
      }).should.throw();
    });

    it('should store coordinates', function(){
      const p = position(5, 6);

      p.get('x').should.equal(5);
      p.get('y').should.equal(6);
    });

    it('should default to (0, 0)', function(){
      const p = position();

      p.get('x').should.equal(0);
      p.get('y').should.equal(0);
    });
  });
});
