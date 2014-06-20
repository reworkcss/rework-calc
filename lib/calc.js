/**
 * Module dependencies.
 */

var balanced = require('balanced-match');
var visit = require('rework-visit');

/**
 * Constants.
 */
var DEFAULT_UNIT = 'px',
    CALC_FUNC_IDENTIFIER =  'calc',

    EXPRESSION_OPT_VENDOR_PREFIX = '(\\-[a-z]+\\-)?',
    EXPRESSION_METHOD_REGEXP = EXPRESSION_OPT_VENDOR_PREFIX + CALC_FUNC_IDENTIFIER,
    EXPRESSION_REGEXP = '\\b' + EXPRESSION_METHOD_REGEXP + '\\(';

/**
 * Module export.
 */

module.exports = function calc(style) {
  // resolve calculations
  visit(style, function (declarations, node) {
    var decl;
    var resolvedValue;
    var value;

    for (var i = 0; i < declarations.length; i++) {
      decl = declarations[i];
      value = decl.value;

      // skip comments
      if (decl.type !== 'declaration') continue;
      // skip values that don't contain calc() functions
      if (!value || value.indexOf(CALC_FUNC_IDENTIFIER + '(') === -1) continue;

      decl.value = resolveValue(value);
    }
  });
};

/**
 * Parses expressions in a value
 *
 * @param {String} value
 * @returns {Array}
 * @api private
 */
function getExpressionsFromValue(value) {
    var parentheses = 0,
        expressions = [],
        start = null;

    // Parse value and extract expressions:
    for (var i = 0; i < value.length; i++) {
        if (value[i] == '(' && value.slice(i - 4, i) == CALC_FUNC_IDENTIFIER && !start) {
            start = i;
            parentheses++;
        } else if (value[i] == '(' && start !== null) {
            parentheses++;
        } else if (value[i] == ')' && start !== null) {
            if (!--parentheses) {
                expressions.push(value.slice(start + 1, i));
                start = null;
            }
        }
    }

    return expressions;
}

/**
 * Walkthrough all expressions, evaluate them and insert them into the declaration
 *
 * @param {Array} expressions
 * @param {Object} declaration
 * @api private
 */
function resolveValue(value) {
  var balancedParens = balanced('(', ')', value);
  var calcStartIndex = value.indexOf(CALC_FUNC_IDENTIFIER + '(');
  var calcRef = balanced('(', ')', value.substring(calcStartIndex));

  if (!balancedParens) throw new Error('rework-calc: missing closing ")" in the value "' + value + '"');
  if (!calcRef || calcRef.body === '') throw new Error('rework-calc: calc() must contain a non-whitespace string');

  getExpressionsFromValue(value).forEach(function (expression) {
    var result = evaluateExpression(expression);

    if (!result) return;

    // Insert the evaluated value:
    var expRegexp = new RegExp(EXPRESSION_METHOD_REGEXP + '\\(' + escapeExp(expression) + '\\)');
    value = value.replace(expRegexp, result);
  });

  return value
}

/**
 * Evaluates an expression
 *
 * @param {String} expression
 * @returns {String}
 * @api private
 */
function evaluateExpression (expression) {
    var originalExpression = CALC_FUNC_IDENTIFIER + '(' + expression + ')';

    // Remove method names for possible nested expressions:
    expression = expression.replace(new RegExp(EXPRESSION_REGEXP, 'g'), '(');

    var uniqueUnits = getUnitsInExpression(expression);

    // If multiple units let the expression be (i.e. fallback to CSS3 calc())
    if (uniqueUnits.length > 1)
        return false;

    if (!uniqueUnits.length)
        console.warn('No unit found in expression: "' + originalExpression + '", defaults to: "' + DEFAULT_UNIT + '"');

    // Use default unit if needed:
    var unit = uniqueUnits[0] || DEFAULT_UNIT;

    if (unit === '%') {
        // Convert percentages to numbers, to handle expressions like: 50% * 50% (will become: 25%):
        expression = expression.replace(/\b[0-9\.]+%/g, function (percent) {
            return parseFloat(percent.slice(0, -1)) * 0.01;
        });
    }

    // Remove units in expression:
    var toEvaluate = expression.replace(new RegExp(unit, 'g'), '');

    var result;

    try {
        result = eval(toEvaluate);
    } catch (e) {
        return false;
    }

    // Transform back to a percentage result:
    if (unit === '%')
        result *= 100;

    // We don't need units for zero values...
    if (result !== 0)
        result += unit;

    return result;
}

/**
 * Checks what units are used in an expression
 *
 * @param {String} expression
 * @returns {Array}
 * @api private
 */
function getUnitsInExpression(expression) {
    var uniqueUnits = [],
        unitRegEx = /[\.0-9]([%a-z]+)/g,
        matches;

    while (matches = unitRegEx.exec(expression)) {
        if (!matches || !matches[1]) continue;
        if (!~uniqueUnits.indexOf(matches[1]))
            uniqueUnits.push(matches[1]);
    }

    return uniqueUnits;
}

/**
 * Escape string for inclusion in a regex pattern without conflicts
 *
 * @param  {String} str String to escape
 * @return {String} Escaped string
 * @api private
 */
function escapeExp(str) {
    return String(str).replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
}
