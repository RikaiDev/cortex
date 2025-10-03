/**
 * ESLint configuration for detecting future development variables
 *
 * This configuration helps distinguish between truly unused variables
 * and variables that are intentionally reserved for future development.
 */

module.exports = {
  extends: ["./.eslintrc.cjs"],
  rules: {
    // Override the no-unused-vars rule to be more specific
    "no-unused-vars": [
      "error",
      {
        vars: "all", // Check all variables
        args: "all", // Check all function arguments
        ignoreRestSiblings: false,
        caughtErrors: "all",
        varsIgnorePattern: "^_future_", // Variables prefixed with _future_ are ignored
        argsIgnorePattern: "^_future_", // Arguments prefixed with _future_ are ignored
      },
    ],
    // Custom rules for future development variables would need to be implemented as a proper ESLint plugin
  },
};
