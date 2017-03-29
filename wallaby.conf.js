module.exports = function (w) {
  return {
    files: [
      // Application code
      { pattern: 'src/**/*.ts', load: false },
      // Support files
      { pattern: 'src/**/*.json', load: false },
      { pattern: 'package.json', load: false },
      { pattern: 'spec/**/*.json', load: false },
      { pattern: 'spec/helpers/**/*.ts', load: false },
    ],
    tests: [
      'spec/unit/**/*.spec.ts',
    ],
    env: {
      type: 'node',
    },
    testFramework: 'mocha',
    compilers: {
      '**/*.ts': w.compilers.typeScript({ module: 1, target: 2 }), // CommonJS & ES6
    },
  };
};