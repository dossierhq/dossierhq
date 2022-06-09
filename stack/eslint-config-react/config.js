function buildRules(profile) {
  return {
    extends: [
      "@jonasb/eslint-config-datadata-generic/profile/library-esm.js",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "detect" } },
  };
}

exports.buildRules = buildRules;
