/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-url': { url: 'inline', basePath: '../node_modules/leaflet/dist/' },
  },
};

export default config;
