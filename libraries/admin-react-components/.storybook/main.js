module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  core: {
    builder: 'webpack5',
  },
  features: { postcss: false },
  reactOptions: {
    strictMode: true,
  },
  typescript: {
    //TODO reactivate docgen: https://github.com/styleguidist/react-docgen-typescript/issues/356
    reactDocgen: 'none',
  },
};
