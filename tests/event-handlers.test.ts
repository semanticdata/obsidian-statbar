jest.mock('obsidian');

import { App, Plugin, PluginManifest, MarkdownView } from 'obsidian';
import StatBarPlugin from '../main';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('StatBarPlugin Event Handler Tests', () => {
  let plugin: StatBarPlugin;
  let mockApp: any;
  let mockManifest: PluginManifest;
  let mockStatusBarItem: any;
  let mockLastSavedTimeEl: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStatusBarItem = {
      setText: jest.fn(),
      setTitle: jest.fn(),
      setAttribute: jest.fn(),
      remove: jest.fn()
    };

    mockLastSavedTimeEl = {
      setText: jest.fn(),
      remove: jest.fn()
    };

    mockApp = {
      workspace: {
        on: jest.fn(() => ({ unload: jest.fn() })),
        off: jest.fn(),
        getActiveFile: jest.fn(),
        getActiveViewOfType: jest.fn(() => ({
          editor: {
            getValue: jest.fn(() => 'Sample text for testing'),
            getSelection: jest.fn(() => ''),
            getCursor: jest.fn((type?: string) => {
              // Mock cursor positions - same position means no selection
              return { line: 0, ch: 0 };
            })
          },
          getViewData: jest.fn(() => 'Sample text for testing')
        }))
      },
      vault: {
        on: jest.fn(() => ({ unload: jest.fn() })),
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

    // Assign the mocked status bar elements to the plugin
    (plugin as any).statusBarItemEl = mockStatusBarItem;
    (plugin as any).lastSavedTimeEl = mockLastSavedTimeEl;

    // Mock the addSettingTab method
    plugin.addSettingTab = jest.fn();

    // Mock registerEvent method
    plugin.registerEvent = jest.fn();

    // Mock registerDomEvent method
    plugin.registerDomEvent = jest.fn();
  });



  test('should register file-open event handler during onload', async () => {
    await plugin.onload();

    expect(plugin.registerEvent).toHaveBeenCalledWith(
      expect.anything()
    );

    // Verify that workspace.on was called for file-open
    expect(mockApp.workspace.on).toHaveBeenCalledWith('file-open', expect.any(Function));
  });

  test('should register active-leaf-change event handler during onload', async () => {
    await plugin.onload();

    expect(mockApp.workspace.on).toHaveBeenCalledWith('active-leaf-change', expect.any(Function));
  });

  test('should register editor-change event handler during onload', async () => {
    await plugin.onload();

    expect(mockApp.workspace.on).toHaveBeenCalledWith('editor-change', expect.any(Function));
  });

  test('should register vault modify event handler during onload', async () => {
    await plugin.onload();

    expect(mockApp.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
  });

  test('should call updateWordCount when file-open event is triggered', async () => {
    const updateWordCountSpy = jest.spyOn(plugin, 'updateWordCount').mockImplementation();

    await plugin.onload();

    // Get the file-open event handler
    const fileOpenHandler = mockApp.workspace.on.mock.calls
      .find((call: any) => call[0] === 'file-open')[1];

    // Trigger the event
    fileOpenHandler();

    expect(updateWordCountSpy).toHaveBeenCalled();
  });

  test('should call updateWordCount when active-leaf-change event is triggered', async () => {
    const updateWordCountSpy = jest.spyOn(plugin, 'updateWordCount').mockImplementation();

    await plugin.onload();

    // Get the active-leaf-change event handler
    const leafChangeHandler = mockApp.workspace.on.mock.calls
      .find((call: any) => call[0] === 'active-leaf-change')[1];

    // Trigger the event with a mock leaf
    leafChangeHandler({ view: {} });

    expect(updateWordCountSpy).toHaveBeenCalled();
  });

  test('should call debouncedUpdate when editor-change event is triggered', async () => {
    const debouncedUpdateSpy = jest.spyOn(plugin as any, 'debouncedUpdate').mockImplementation();

    await plugin.onload();

    // Get the editor-change event handler
    const editorChangeHandler = mockApp.workspace.on.mock.calls
      .find((call: any) => call[0] === 'editor-change')[1];

    // Trigger the event
    editorChangeHandler();

    expect(debouncedUpdateSpy).toHaveBeenCalled();
  });

  test('should call updateLastSavedTime when vault modify event is triggered', async () => {
    const updateLastSavedTimeSpy = jest.spyOn(plugin, 'updateLastSavedTime').mockImplementation();

    await plugin.onload();

    // Get the vault modify event handler
    const modifyHandler = mockApp.vault.on.mock.calls
      .find((call: any) => call[0] === 'modify')[1];

    // Trigger the event
    modifyHandler();

    expect(updateLastSavedTimeSpy).toHaveBeenCalled();
  });

  test('should set timeout when debouncedUpdate is called', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    (plugin as any).debouncedUpdate();

    // Should set timeout with 300ms delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  test('should clear existing debounce timer when debouncedUpdate is called', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    // Call debouncedUpdate to set a timer
    (plugin as any).debouncedUpdate();

    // Call it again to clear the previous timer
    (plugin as any).debouncedUpdate();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test('should handle case when no active view exists', () => {
    mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

    plugin.updateWordCount();

    expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
    expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
  });

  test('should update last saved time with current time when showLastSavedTime is true', () => {
    plugin.settings.showLastSavedTime = true;
    const mockDate = new Date('2023-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    plugin.updateLastSavedTime();

    expect(mockLastSavedTimeEl.setText).toHaveBeenCalledWith(
      expect.stringContaining('Last Saved:')
    );
  });

  test('should clear last saved time display when showLastSavedTime is false', () => {
    plugin.settings.showLastSavedTime = false;

    plugin.updateLastSavedTime();

    expect(mockLastSavedTimeEl.setText).toHaveBeenCalledWith('');
  });

  test('should create content hash correctly', () => {
    const text = 'This is a test text that is longer than 100 characters to test the hash function properly and ensure it works as expected';
    const hash = (plugin as any).getContentHash(text);

    expect(hash).toBe(text.length + text.slice(0, 100) + text.slice(-100));
  });

  test('should return cached stats when hash matches', () => {
    const hash = 'test-hash';
    const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

    (plugin as any).setCachedStats(hash, stats);
    const cachedStats = (plugin as any).getCachedStats(hash);

    expect(cachedStats).toEqual(stats);
  });

  test('should return null when hash does not match cached stats', () => {
    const hash1 = 'test-hash-1';
    const hash2 = 'test-hash-2';
    const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

    (plugin as any).setCachedStats(hash1, stats);
    const cachedStats = (plugin as any).getCachedStats(hash2);

    expect(cachedStats).toBeNull();
  });

  test('should set cached stats correctly', () => {
    const hash = 'test-hash';
    const stats = { wordCount: 10, charCount: 50, readTime: '1:00' };

    (plugin as any).setCachedStats(hash, stats);

    expect((plugin as any).lastContentHash).toBe(hash);
    expect((plugin as any).cachedStats).toEqual(stats);
  });
});