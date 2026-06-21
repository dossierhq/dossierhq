/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-remove-rules': {
      rulesToRemove: {
        '.leaflet-control-layers-toggle': 'background-image',
        '.leaflet-retina .leaflet-control-layers-toggle': 'background-image',
        '.leaflet-default-icon-path': 'background-image',
      },
    },
  },
};

export default config;
