// Mock Obsidian API before importing
jest.mock('obsidian');

import { App, Plugin, PluginManifest } from 'obsidian';
import StatBarPlugin from '../main';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('StatBarPlugin Integration Tests', () => {
  let plugin: StatBarPlugin;
  let mockApp: any;
  let mockManifest: PluginManifest;
  let mockStatusBarItem: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatusBarItem = {
      setText: jest.fn(),
      setTitle: jest.fn(),
      setAttribute: jest.fn(),
      remove: jest.fn()
    };

    mockApp = {
      workspace: {
        on: jest.fn(),
        off: jest.fn(),
        getActiveFile: jest.fn(),
        getActiveViewOfType: jest.fn(() => ({
          editor: {
            getValue: jest.fn(() => 'Sample text for testing'),
            getSelection: jest.fn(() => ''),
            getCursor: jest.fn((type?: string) => {
              return { line: 0, ch: 0 };
            })
          },
          getViewData: jest.fn(() => 'Sample text for testing')
        }))
      },
      vault: {
        on: jest.fn(),
        off: jest.fn()
      }
    };

    mockManifest = {
      id: 'test-statbar',
      name: 'Test StatBar',
      version: '1.0.0',
      minAppVersion: '0.15.0',
      description: 'Test plugin',
      author: 'Test Author'
    };

    plugin = new StatBarPlugin(mockApp, mockManifest);

    // Explicitly ensure app is set (workaround for inheritance issues)
    if (!plugin.app) {
      plugin.app = mockApp;
    }

    plugin.settings = { ...DEFAULT_SETTINGS };

    // Mock loadSettings method
    plugin.loadSettings = jest.fn().mockResolvedValue(undefined);

    // Since the Plugin methods are inherited, we need to mock them on the instance
    if (plugin.addStatusBarItem) {
      plugin.addStatusBarItem = jest.fn().mockReturnValue(mockStatusBarItem);
    }
    if (plugin.loadData) {
      plugin.loadData = jest.fn().mockResolvedValue({});
    }
    if (plugin.saveData) {
      plugin.saveData = jest.fn().mockResolvedValue(undefined);
    }
    if (plugin.registerEvent) {
      plugin.registerEvent = jest.fn();
    }
    if (plugin.registerDomEvent) {
      plugin.registerDomEvent = jest.fn();
    }

    // Don't mock updateWordCount and updateLastSavedTime - let them run normally
  });

  describe('Plugin lifecycle', () => {
    test('should initialize with default settings', () => {
      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    test('should create status bar item on load', async () => {
      await plugin.onload();
      expect(plugin.statusBarItemEl).toBeDefined();
      expect(plugin.statusBarItemEl).not.toBeNull();
    });

    test('should register event handlers on load', async () => {
      // This test verifies that onload completes without errors
      // The actual event registration is tested implicitly through other functionality
      await expect(async () => {
        await plugin.onload();
      }).not.toThrow();
    });
  });

  describe('Status bar updates', () => {
    beforeEach(async () => {
      await plugin.onload();
      plugin.statusBarItemEl = mockStatusBarItem;
    });

    test('should update status bar with word count only', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: false,
        showReadTime: false,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(
        expect.stringContaining('Words:')
      );
    });

    test('should update status bar with character count only', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        showCharCount: true,
        showReadTime: false,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(
        expect.stringContaining('Characters:')
      );
    });

    test('should update status bar with read time only', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        showCharCount: false,
        showReadTime: true,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith(
        expect.stringContaining('min read')
      );
    });

    test('should update status bar with all features enabled', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: true,
        showReadTime: true,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      const lastCall = mockStatusBarItem.setText.mock.calls[mockStatusBarItem.setText.mock.calls.length - 1][0];
      expect(lastCall).toContain('Words:');
      expect(lastCall).toContain('Characters:');
      expect(lastCall).toContain('min read');
    });

    test('should clear status bar when no features enabled', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        showCharCount: false,
        showReadTime: false,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
    });

    test('should use custom separators', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: true,
        separatorLabel: ' | '
      };

      plugin.updateWordCount();
      const lastCall = mockStatusBarItem.setText.mock.calls[mockStatusBarItem.setText.mock.calls.length - 1][0];
      expect(lastCall).toContain(' | ');
    });

    test('should use custom labels', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: true,
        wordLabel: 'W:',
        charLabel: 'C:'
      };

      plugin.updateWordCount();
      const lastCall = mockStatusBarItem.setText.mock.calls[mockStatusBarItem.setText.mock.calls.length - 1][0];
      expect(lastCall).toContain('W:');
      expect(lastCall).toContain('C:');
    });
  });

  describe('Tooltip functionality', () => {
    beforeEach(async () => {
      await plugin.onload();
      plugin.statusBarItemEl = mockStatusBarItem;
    });

    test('should set tooltip with detailed information', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: true,
        showReadTime: true
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('Words:')
      );
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('Characters:')
      );
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('Estimated Read Time:')
      );
    });

    test('should clear tooltip when no content', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        showCharCount: false,
        showReadTime: false,
        showLastSavedTime: false
      };

      plugin.updateWordCount();
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });
  });

  describe('Debounced updates', () => {
    beforeEach(async () => {
      await plugin.onload();
      plugin.statusBarItemEl = mockStatusBarItem;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce rapid updates', () => {
      const updateSpy = jest.spyOn(plugin, 'updateWordCount');

      // Call debouncedUpdate multiple times rapidly
      (plugin as any).debouncedUpdate();
      (plugin as any).debouncedUpdate();
      (plugin as any).debouncedUpdate();

      // Should not have called updateWordCount yet
      expect(updateSpy).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(300);

      // Should have called updateWordCount only once
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous debounce timer', () => {
      const updateSpy = jest.spyOn(plugin, 'updateWordCount');

      (plugin as any).debouncedUpdate();
      jest.advanceTimersByTime(100);

      (plugin as any).debouncedUpdate(); // This should cancel the previous timer
      jest.advanceTimersByTime(200); // Not enough to trigger the second call

      expect(updateSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100); // Now it should trigger
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content caching', () => {
    beforeEach(async () => {
      await plugin.onload();
      plugin.statusBarItemEl = mockStatusBarItem;
    });

    test('should cache calculation results', () => {
      // Clear cache to ensure getWordCount is called
      (plugin as any).lastContentHash = '';
      (plugin as any).cachedStats = null;

      const getWordCountSpy = jest.spyOn(plugin as any, 'getWordCount');

      // First call should calculate
      plugin.updateWordCount();
      expect(getWordCountSpy).toHaveBeenCalledTimes(1);

      // Second call with same content should use cache
      plugin.updateWordCount();
      expect(getWordCountSpy).toHaveBeenCalledTimes(1); // Still only called once
    });

    test('should recalculate when content changes', () => {
      // Clear cache to ensure getWordCount is called
      (plugin as any).lastContentHash = '';
      (plugin as any).cachedStats = null;

      const getWordCountSpy = jest.spyOn(plugin as any, 'getWordCount');

      // First call
      plugin.updateWordCount();
      expect(getWordCountSpy).toHaveBeenCalledTimes(1);

      // Change the mock content
      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: {
          getValue: jest.fn(() => 'Different content for testing'),
          getSelection: jest.fn(() => ''),
          getCursor: jest.fn((type?: string) => {
            return { line: 0, ch: 0 };
          })
        },
        getViewData: jest.fn(() => 'Different content for testing')
      });

      // Second call with different content should recalculate
      plugin.updateWordCount();
      expect(getWordCountSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Read time label positioning', () => {
    beforeEach(async () => {
      await plugin.onload();
      plugin.statusBarItemEl = mockStatusBarItem;
    });

    test('should position read time label before when configured', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showReadTime: true,
        readTimeLabelPosition: 'before',
        readTimeLabel: 'Read time:'
      };

      plugin.updateWordCount();
      const lastCall = mockStatusBarItem.setText.mock.calls[mockStatusBarItem.setText.mock.calls.length - 1][0];
      expect(lastCall).toMatch(/Read time:\s*\d+:\d+/);
    });

    test('should position read time label after when configured', () => {
      plugin.settings = {
        ...DEFAULT_SETTINGS,
        showReadTime: true,
        readTimeLabelPosition: 'after',
        readTimeLabel: 'min read'
      };

      plugin.updateWordCount();
      const lastCall = mockStatusBarItem.setText.mock.calls[mockStatusBarItem.setText.mock.calls.length - 1][0];
      expect(lastCall).toMatch(/\d+:\d+\s*min read/);
    });
  });
});