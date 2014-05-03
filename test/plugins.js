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

describe('rework-calc', function() {
  it('should calculate expressions with only one unit involved', function() {
    rework(css.in('calc'))
      .use(calc)
      .toString()
      .should.equal(css.out('calc'));
  });

  it('should calculate expressions with percents correctly', function () {
    rework(css.in('calc-percent'))
      .use(calc)
      .toString()
      .should.equal(css.out('calc-percent'));
  });

  it('should use CSS3 Calc function as fallback for expressions with multiple units', function () {
    rework(css.in('calc-complex'))
      .use(calc)
      .toString()
      .should.equal(css.out('calc-complex'));
  });

  it('should handle vendor prefixed expressions', function () {
    rework(css.in('calc-prefix'))
      .use(calc)
      .toString()
      .should.equal(css.out('calc-prefix'));
  });

});
