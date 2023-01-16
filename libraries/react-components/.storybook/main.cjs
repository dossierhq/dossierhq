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
    // TODO: Disable docgen due to plenty of deprecation warnings when starting Storybook
    reactDocgen: false,
  },
  webpackFinal: (config) => {
    config.resolve.plugins = [...(config.resolve.plugins || []), new ResolveJsToTsPlugin()];
    return config;
  },
};

class ResolveJsToTsPlugin {
  source = 'resolve';
  target = 'resolve';

  apply(resolver) {
    const target = resolver.ensureHook(this.target);
    resolver
      .getHook(this.source)
      .tapAsync('ResolveJsToTsPlugin', function (request, resolveContext, callback) {
        const inTypeScriptFile = request.context.issuer?.match(/\.tsx?$/);
        if (request.request.endsWith('.js') && inTypeScriptFile) {
          // Could refer to .ts, .tsx
          const requestWithoutFileEnding = request.request.slice(0, -'.js'.length);
          const modifiedRequest = { ...request, request: requestWithoutFileEnding };
          return resolver.doResolve(target, modifiedRequest, null, resolveContext, callback);
        }
        callback();
      });
  }
}
