rework-calc
===================

A `calc()` plugin for the CSS Preprocessor [rework](https://github.com/visionmedia/rework).

## Installation

```bash
npm install rework-calc
```

## Usage

An example of how to use `rework-calc`:

```javascript
var rework = require('rework'),
    calc = require('rework-calc');

var css = rework(cssString).use(calc).toString();
```

For available plugins see plugins section below.

## calc() plugin

Add calculations support. A feature to do simple calculations, and can be
particularly useful together with the [rework-vars](https://npmjs.org/package/rework-vars) plugin.

When multiple units are mixed together in the same expression, the calc() statement
is left as is, to fallback to the CSS3 Calc feature.

**Example** (with rework-vars enabled as well):

```css
:root {
  var-main-font-size: 16px;
}

body {
  font-size: var(main-font-size);
}

h1 {
  font-size: calc(var(main-font-size) * 2);
  height: calc(100px - 2em);
}
```

**yields**:

```css
:root {
  var-main-font-size: 16px
}

body {
  font-size: 16px
}

h1 {
  font-size: 32px;
  height: calc(100px - 2em)
}
```

See unit tests for another example.

## Unit tests

Make sure the dev-dependencies are installed, and then run:

```bash
npm test
```

## Contributing

Feel free to contribute!

## License

MIT
