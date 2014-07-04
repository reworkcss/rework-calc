var assert = require('assert');
var calc = require('..');
var read = require('fs').readFileSync;
var rework = require('rework');
var vars = require('rework-vars');

function fixture(name) {
  return read('test/fixtures/' + name + '.css', 'utf8').trim();
}

function compareFixtures(name) {
  var actual = rework(fixture(name + '.in')).use(calc).toString().trim();
  var expected = fixture(name + '.out');
  return assert.equal(actual, expected);
}

describe('rework-calc', function () {
  it('throws an error when a calc function is empty', function () {
    var output = function () {
      return rework(fixture('substitution-empty')).use(calc).toString();
    };
    assert.throws(output, Error, 'rework-calc: calc() must contain a non-whitespace string');
  });

  it('throws an error when a calc function is malformed', function () {
    var output = function () {
      return rework(fixture('substitution-malformed')).use(calc).toString();
    };
    assert.throws(output, Error, 'rework-calc: missing closing ")" in the value "calc(10px - 5px"');
  });

  it('should calculate expressions with only one unit involved', function () {
    compareFixtures('calc');
  });

  it('should calculate expressions with percents correctly', function () {
    compareFixtures('calc-percent');
  });

  it('should use CSS3 Calc function as fallback for expressions with multiple units', function () {
    compareFixtures('calc-fallback');
  });

  it('should handle vendor prefixed expressions', function () {
    compareFixtures('calc-prefix');
  });

  it('should resolve what is possible in complex calc whenever it\'s possible', function () {
    var name = 'calc-complex'
    var actual = rework(fixture(name + '.in'))
      .use(vars())
      .use(calc)
      .toString()
      .trim();
    var expected = fixture(name + '.out');
    return assert.equal(actual, expected);
  });
});
