// Test setup and global configuration
import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Global test setup
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Global test cleanup
  delete process.env.NODE_ENV;
});