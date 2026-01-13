// Vitest configuration - works with npx vitest
// Uses inline config to avoid import issues
export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 30000,
  },
};
