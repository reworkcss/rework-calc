var calc = require('../index'),
    rework = require('rework'),
    expect = require('chai').expect,
    read = require('fs').readFileSync;

function fixture(name){
  return read('test/fixtures/' + name + '.css', 'utf8').trim();
}

function compareFixtures(name, options){
  return expect(
    rework(fixture(name + '.in'))
    .use(calc(options))
    .toString().trim()
  ).to.equal(fixture(name + '.out'));
}

describe('rework-calc', function() {
  it('throws an error when a calc function is empty', function () {
    var output = function () {
      return rework(fixture('substitution-empty')).use(calc()).toString();
    };
    expect(output).to.Throw(Error, 'rework-calc: calc() must contain a non-whitespace string');
  });

  it('throws an error when a variable function is malformed', function () {
    var output = function () {
      return rework(fixture('substitution-malformed')).use(calc()).toString();
    };
    expect(output).to.Throw(Error, 'rework-calc: missing closing ")" in the value "calc(10px - 5px"');
  });


  it('should calculate expressions with only one unit involved', function() {
    compareFixtures('calc');
  });

  it('should calculate expressions with percents correctly', function () {
    compareFixtures('calc-percent');
  });

  it('should use CSS3 Calc function as fallback for expressions with multiple units', function () {
    compareFixtures('calc-complex');
  });

  it('should handle vendor prefixed expressions', function () {
    compareFixtures('calc-prefix');
  });

  it('should preserves calc() when `preserve` is `true`', function() {
    compareFixtures('preserve', {preserve: true});
  });
});
