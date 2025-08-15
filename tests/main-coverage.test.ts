jest.mock('obsidian');

import { PluginManifest } from 'obsidian';
import StatBarPlugin from '../main';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('StatBarPlugin Coverage Tests', () => {
  let plugin: StatBarPlugin;
  let mockApp: any;
  let mockManifest: PluginManifest;
  let mockStatusBarItem: any;
  let mockLastSavedTimeEl: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStatusBarItem = document.createElement('div');
    (mockStatusBarItem as any).setText = jest.fn();
    (mockStatusBarItem as any).setTitle = jest.fn();
    (mockStatusBarItem as any).addClass = jest.fn();
    (mockStatusBarItem as any).removeClass = jest.fn();
    (mockStatusBarItem as any).setAttribute = jest.fn();
    (mockStatusBarItem as any).remove = jest.fn();

    mockLastSavedTimeEl = document.createElement('div');
    (mockLastSavedTimeEl as any).setText = jest.fn();
    (mockLastSavedTimeEl as any).addClass = jest.fn();
    (mockLastSavedTimeEl as any).removeClass = jest.fn();
    (mockLastSavedTimeEl as any).remove = jest.fn();

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
    plugin.settings = { ...DEFAULT_SETTINGS };
    // Ensure the plugin has access to the app
    (plugin as any).app = mockApp;

    // Mock the addStatusBarItem method
    plugin.addStatusBarItem = jest.fn()
      .mockReturnValueOnce(mockStatusBarItem)
      .mockReturnValueOnce(mockLastSavedTimeEl);

    // Mock the addSettingTab method
    plugin.addSettingTab = jest.fn();

    // Mock registerEvent method
    plugin.registerEvent = jest.fn();

    // Mock registerDomEvent method
    plugin.registerDomEvent = jest.fn();

    plugin.statusBarItemEl = mockStatusBarItem;
    plugin.lastSavedTimeEl = mockLastSavedTimeEl;
  });



  describe('Event Handler Registration (Lines 40, 47, 54, 65)', () => {
    test('should register all event handlers during onload', async () => {
      await plugin.onload();

      // Verify all event handlers are registered
      expect(mockApp.workspace.on).toHaveBeenCalledWith('file-open', expect.any(Function));
      expect(mockApp.workspace.on).toHaveBeenCalledWith('active-leaf-change', expect.any(Function));
      expect(mockApp.workspace.on).toHaveBeenCalledWith('editor-change', expect.any(Function));
      expect(mockApp.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
    });

    test('should call updateWordCount when file-open event is triggered', async () => {
      const updateWordCountSpy = jest.spyOn(plugin, 'updateWordCount').mockImplementation();

      await plugin.onload();

      // Get and trigger the file-open event handler
      const fileOpenHandler = mockApp.workspace.on.mock.calls
        .find((call: any) => call[0] === 'file-open')[1];
      fileOpenHandler();

      expect(updateWordCountSpy).toHaveBeenCalled();
    });

    test('should call updateWordCount when active-leaf-change event is triggered', async () => {
      const updateWordCountSpy = jest.spyOn(plugin, 'updateWordCount').mockImplementation();

      await plugin.onload();

      // Get and trigger the active-leaf-change event handler
      const leafChangeHandler = mockApp.workspace.on.mock.calls
        .find((call: any) => call[0] === 'active-leaf-change')[1];
      leafChangeHandler({ view: {} });

      expect(updateWordCountSpy).toHaveBeenCalled();
    });

    test('should call debouncedUpdate when editor-change event is triggered', async () => {
      const debouncedUpdateSpy = jest.spyOn(plugin as any, 'debouncedUpdate').mockImplementation();

      await plugin.onload();

      // Get and trigger the editor-change event handler
      const editorChangeHandler = mockApp.workspace.on.mock.calls
        .find((call: any) => call[0] === 'editor-change')[1];
      editorChangeHandler();

      expect(debouncedUpdateSpy).toHaveBeenCalled();
    });

    test('should call updateLastSavedTime when vault modify event is triggered', async () => {
      const updateLastSavedTimeSpy = jest.spyOn(plugin, 'updateLastSavedTime').mockImplementation();

      await plugin.onload();

      // Get and trigger the vault modify event handler
      const modifyHandler = mockApp.vault.on.mock.calls
        .find((call: any) => call[0] === 'modify')[1];
      modifyHandler();

      expect(updateLastSavedTimeSpy).toHaveBeenCalled();
    });
  });

  describe('Display Logic Edge Cases (Lines 144-145)', () => {
    test('should handle empty display when all options are disabled', () => {
      const mockEditor = {
        getSelection: jest.fn(() => ''),
        getValue: jest.fn(() => 'test content'),
        getCursor: jest.fn((type?: string) => {
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'test content')
      });

      // Disable all display options
      plugin.settings.showWordCount = false;
      plugin.settings.showCharCount = false;
      plugin.settings.showReadTime = false;

      plugin.updateWordCount();

      // Should set empty text and aria-label (lines 144-145)
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });

    test('should handle null active view', () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

      plugin.updateWordCount();

      // Should set empty text and aria-label (lines 144-145)
      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });
  });

  describe('Performance Optimization Methods (Lines 199-201, 208-216)', () => {
    test('should clear existing debounce timer when debouncedUpdate is called', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Set an initial timer
      (plugin as any).debounceTimer = setTimeout(() => { }, 1000);

      // Call debouncedUpdate which should clear the timer (line 199)
      (plugin as any).debouncedUpdate();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    test('should handle null debounce timer gracefully', () => {
      (plugin as any).debounceTimer = null;

      // Should not throw error when timer is null (line 199)
      expect(() => (plugin as any).debouncedUpdate()).not.toThrow();
    });

    test('should set new timeout when debouncedUpdate is called', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      (plugin as any).debouncedUpdate();

      // Should set new timeout (line 200)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
    });

    test('should generate content hash correctly', () => {
      const text = 'This is a test text that is longer than 100 characters to test the hash function properly and ensure it works as expected';
      const hash = (plugin as any).getContentHash(text);

      // Should combine length + first 100 + last 100 chars (line 208)
      expect(hash).toBe(text.length + text.slice(0, 100) + text.slice(-100));
    });

    test('should return cached stats when hash matches', () => {
      const hash = 'test-hash';
      const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

      // Set cached stats (lines 215-216)
      (plugin as any).setCachedStats(hash, stats);

      // Should return cached stats when hash matches (lines 212-214)
      const cachedStats = (plugin as any).getCachedStats(hash);
      expect(cachedStats).toEqual(stats);
    });

    test('should return null when hash does not match', () => {
      const hash1 = 'test-hash-1';
      const hash2 = 'test-hash-2';
      const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

      (plugin as any).setCachedStats(hash1, stats);

      // Should return null when hash doesn't match (line 215)
      const cachedStats = (plugin as any).getCachedStats(hash2);
      expect(cachedStats).toBeNull();
    });

    test('should set cached stats correctly', () => {
      const hash = 'test-hash';
      const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

      (plugin as any).setCachedStats(hash, stats);

      // Should set both hash and stats (lines 215-216)
      expect((plugin as any).lastContentHash).toBe(hash);
      expect((plugin as any).cachedStats).toEqual(stats);
    });
  });

  describe('Last Saved Time Display', () => {
    test('should display last saved time when enabled', () => {
      plugin.settings.showLastSavedTime = true;
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      plugin.updateLastSavedTime();

      expect(mockLastSavedTimeEl.setText).toHaveBeenCalledWith(
        expect.stringContaining('Last Saved:')
      );
    });

    test('should clear last saved time display when disabled', () => {
      plugin.settings.showLastSavedTime = false;

      plugin.updateLastSavedTime();

      expect(mockLastSavedTimeEl.setText).toHaveBeenCalledWith('');
    });
  });

  describe('Settings Persistence', () => {
    test('should load settings with default fallback', async () => {
      plugin.loadData = jest.fn().mockResolvedValue(null);

      await plugin.loadSettings();

      expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    test('should merge loaded settings with defaults', async () => {
      const partialSettings = { showWordCount: false };
      plugin.loadData = jest.fn().mockResolvedValue(partialSettings);

      await plugin.loadSettings();

      expect(plugin.settings.showWordCount).toBe(false);
      expect(plugin.settings.showCharCount).toBe(DEFAULT_SETTINGS.showCharCount);
    });

    test('should save settings correctly', async () => {
      plugin.saveData = jest.fn().mockResolvedValue(undefined);

      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('Debounced Updates', () => {
    test('should set timeout when debouncedUpdate is called', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      (plugin as any).debouncedUpdate();

      // Should set timeout with 300ms delay
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
    });
  });
});