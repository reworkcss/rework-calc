var calc = require('../index'),
    rework = require('rework'),
    should = require('chai').Should(),
    read = require('fs').readFileSync;

var css = {
  in: function (name) {
    return this._read(name, 'in');
  },
  out: function (name) {
    return this._read(name, 'out');
  },
  _read: function (name, type) {
    return read(__dirname + '/' + name + '.' + type + '.css', 'utf8');
  }
};

describe('rework-calc', function(){
  it('should add calculations support', function(){
    rework(css.in('calc'))
      .use(rework.references())
      .use(calc)
      .toString()
      .should.equal(css.out('calc'));
  });
});
