function buildRules(profile) {
  return {
    extends: [
      "@dossierhq/eslint-config-generic/profile/library-esm.js",
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
