
/**
 * Calculation Plugin
 *
 * Useful in combination with the [rework-vars](https://npmjs.org/package/rework-vars) plugin, e.g:
 *
 *   :root {
 *     var-base-font-size: 16px;
 *   }
 *   body {
 *     font-size: var(base-font-size);
 *   }
 *   h1 {
 *     font-size: calc(var(base-font-size) * 2);
 *   }
 *
 * Yields:
 *
 *   :root {
 *     var-base-font-size: 16px;
 *   }
 *   body {
 *     font-size: 16px;
 *   }
 *   h1 {
 *     font-size: 32px;
 *   }
 *
 */

module.exports = function (style) {
    rules(style.rules);
};

/**
 * Constants
 */
var DEFAULT_UNIT = 'px',
    EXPRESSION_METHOD_NAME =  'calc',
    EXPRESSION_OPT_VENDOR_PREFIX = '(\\-[a-z]+\\-)?',
    EXPRESSION_METHOD_REGEXP = EXPRESSION_OPT_VENDOR_PREFIX + EXPRESSION_METHOD_NAME,
    EXPRESSION_REGEXP = '\\b' + EXPRESSION_METHOD_REGEXP + '\\(';

/**
 * Visit all rules
 *
 * @param {Array} arr Array with css rules
 * @api private
 */
function rules(arr) {
    arr.forEach(function (rule) {
        if (rule.rules) rules(rule.rules);
        if (rule.declarations) visit(rule.declarations);
    });
}

/**
 * Visit all declarations (in a rule)
 *
 * @param {Array} declarations
 * @api private
 */
function visit(declarations) {
    declarations.forEach(function (decl) {
        if (!hasExpressions(decl.value)) return;

        var expressions = getExpressionsFromValue(decl.value);

        evaluateAndApplyExpressions(expressions, decl);
    });
}

/**
 * Checks if a value contains an expression
 *
 * @param {String} value
 * @returns {Boolean}
 * @api private
 */
function hasExpressions(value) {
    return (new RegExp(EXPRESSION_REGEXP)).exec(value);
}

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
        if (value[i] == '(' && value.slice(i - 4, i) == EXPRESSION_METHOD_NAME && !start) {
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
function evaluateAndApplyExpressions(expressions, declaration) {
    expressions.forEach(function (expression) {
        var result = evaluateExpression(expression);

        if (!result) return;

        // Insert the evaluated value:
        var expRegexp = new RegExp(
                                EXPRESSION_METHOD_REGEXP + '\\(' +
                                escapeExp(expression) + '\\)'
                            );
        declaration.value = declaration.value.replace(expRegexp, result);
    });
}

/**
 * Evaluates an expression
 *
 * @param {String} expression
 * @returns {String}
 * @api private
 */
function evaluateExpression (expression) {
    var originalExpression = EXPRESSION_METHOD_NAME + '(' + expression + ')';

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
