const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {};

module.exports = createJestConfig(customJestConfig);
