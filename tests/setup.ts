// Jest setup file for Obsidian StatBar plugin tests

// Mock Obsidian API since we're testing in Node.js environment

// Make this file a module to satisfy --isolatedModules
export { };

global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock basic Obsidian classes and interfaces
class MockApp {
  vault = {
    on: jest.fn(),
    off: jest.fn()
  };
  workspace = {
    on: jest.fn(),
    off: jest.fn(),
    getActiveFile: jest.fn(),
    getActiveViewOfType: jest.fn()
  };
}

class MockPlugin {
  app: MockApp;
  manifest: any;

  constructor() {
    this.app = new MockApp();
    this.manifest = { id: 'test-plugin', name: 'Test Plugin' };
  }

  addStatusBarItem = jest.fn(() => {
    const mockElement = document.createElement('div');
    (mockElement as any).setText = jest.fn();
    (mockElement as any).setTitle = jest.fn();
    (mockElement as any).addClass = jest.fn();
    (mockElement as any).removeClass = jest.fn();
    return mockElement;
  });

  addSettingTab = jest.fn();
  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
}

// Make mocks available globally
(global as any).MockApp = MockApp;
(global as any).MockPlugin = MockPlugin;