jest.mock('obsidian');

import { App, Plugin, PluginManifest, MarkdownView } from 'obsidian';
import StatBarPlugin from '../main';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('StatBarPlugin Edge Cases and Error Handling', () => {
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

    mockLastSavedTimeEl = {
      setText: jest.fn(),
      remove: jest.fn()
    };

    mockApp = {
      workspace: {
        on: jest.fn(),
        off: jest.fn(),
        getActiveFile: jest.fn(),
        getActiveViewOfType: jest.fn()
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

    plugin.statusBarItemEl = mockStatusBarItem;
    plugin.lastSavedTimeEl = mockLastSavedTimeEl;

    // Mock plugin methods
    plugin.registerEvent = jest.fn();
    plugin.registerDomEvent = jest.fn();
  });

  describe('updateWordCount edge cases', () => {
    test('should handle null active view', () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

      plugin.updateWordCount();

      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });

    test('should handle active view without editor', () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: {
          getSelection: jest.fn(() => ''),
          getValue: jest.fn(() => 'test content'),
          getCursor: jest.fn((type?: string) => {
            return { line: 0, ch: 0 };
          })
        },
        getViewData: jest.fn(() => 'test content')
      });

      plugin.updateWordCount();

      // Should still work with getViewData
      expect(mockStatusBarItem.setText).toHaveBeenCalled();
    });

    test('should handle editor with selection', () => {
      const mockEditor = {
        getSelection: jest.fn(() => 'selected text'),
        getValue: jest.fn(() => 'full document text'),
        getCursor: jest.fn((type?: string) => {
          // Mock different cursor positions to simulate selection
          if (type === 'from') return { line: 0, ch: 0 };
          if (type === 'to') return { line: 0, ch: 13 }; // 'selected text' length
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'full document text')
      });

      plugin.updateWordCount();

      expect(mockEditor.getCursor).toHaveBeenCalled();
      expect(mockStatusBarItem.setText).toHaveBeenCalled();
    });

    test('should handle empty selection', () => {
      const mockEditor = {
        getSelection: jest.fn(() => ''),
        getValue: jest.fn(() => 'full document text'),
        getCursor: jest.fn((type?: string) => {
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'full document text')
      });

      plugin.updateWordCount();

      expect(mockEditor.getCursor).toHaveBeenCalled();
      expect(mockStatusBarItem.setText).toHaveBeenCalled();
    });

    test('should display selection indicator when text is selected', () => {
      const mockEditor = {
        getSelection: jest.fn(() => 'selected text here'),
        getValue: jest.fn(() => 'full document text'),
        getCursor: jest.fn((type?: string) => {
          // Mock different cursor positions to simulate selection
          if (type === 'from') return { line: 0, ch: 0 };
          if (type === 'to') return { line: 0, ch: 18 }; // 'selected text here' length
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'full document text')
      });

      plugin.settings.showWordCount = true;
      plugin.settings.showCharCount = true;
      plugin.settings.separatorLabel = ' | ';

      plugin.updateWordCount();

      const setTextCall = mockStatusBarItem.setText.mock.calls[0][0];
      expect(setTextCall).toContain('Words: 3');
      expect(setTextCall).toContain('Characters: 18');
    });

    test('should handle different separator labels', () => {
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

      plugin.settings.showWordCount = true;
      plugin.settings.showCharCount = true;
      plugin.settings.separatorLabel = ' • ';

      plugin.updateWordCount();

      const setTextCall = mockStatusBarItem.setText.mock.calls[0][0];
      expect(setTextCall).toContain(' • ');
    });

    test('should handle read time display with before position', () => {
      const mockEditor = {
        getSelection: jest.fn(() => ''),
        getValue: jest.fn(() => 'test content with multiple words here'),
        getCursor: jest.fn((type?: string) => {
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'test content with multiple words here')
      });

      plugin.settings.showReadTime = true;
      plugin.settings.readTimeLabelPosition = 'before';
      plugin.settings.readTimeLabel = 'min read';

      plugin.updateWordCount();

      const setTextCall = mockStatusBarItem.setText.mock.calls[0][0];
      expect(setTextCall).toContain('min read');
    });

    test('should handle read time display with after position', () => {
      const mockEditor = {
        getSelection: jest.fn(() => ''),
        getValue: jest.fn(() => 'test content with multiple words here'),
        getCursor: jest.fn((type?: string) => {
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'test content with multiple words here')
      });

      plugin.settings.showReadTime = true;
      plugin.settings.readTimeLabelPosition = 'after';
      plugin.settings.readTimeLabel = 'min read';

      plugin.updateWordCount();

      const setTextCall = mockStatusBarItem.setText.mock.calls[0][0];
      expect(setTextCall).toContain('min read');
    });

    test('should handle all display options disabled', () => {
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

      plugin.settings.showWordCount = false;
      plugin.settings.showCharCount = false;
      plugin.settings.showReadTime = false;

      plugin.updateWordCount();

      expect(mockStatusBarItem.setText).toHaveBeenCalledWith('');
      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });
  });

  describe('calculateReadTime edge cases', () => {
    test('should handle zero word count', () => {
      const readTime = (plugin as any).calculateReadTime(0);
      expect(readTime).toBe('0:00');
    });

    test('should handle very large word count', () => {
      const readTime = (plugin as any).calculateReadTime(10000);
      expect(readTime).toMatch(/^\d+:\d{2}$/);
    });

    test('should handle custom words per minute setting', () => {
      plugin.settings.wordsPerMinute = 100;
      const readTime = (plugin as any).calculateReadTime(200);
      expect(readTime).toBe('2:00');
    });

    test('should format seconds with leading zero', () => {
      plugin.settings.wordsPerMinute = 200;
      const readTime = (plugin as any).calculateReadTime(17); // Should be about 5 seconds
      expect(readTime).toMatch(/^\d+:0\d$/);
    });
  });

  describe('getWordCount edge cases', () => {
    test('should handle text with only punctuation', () => {
      const wordCount = (plugin as any).getWordCount('!@#$%^&*()');
      expect(wordCount).toBe(1);
    });

    test('should handle text with only whitespace', () => {
      const wordCount = (plugin as any).getWordCount('   \n\t   ');
      expect(wordCount).toBe(0);
    });

    test('should handle empty string', () => {
      const wordCount = (plugin as any).getWordCount('');
      expect(wordCount).toBe(0);
    });

    test('should handle text with multiple consecutive spaces', () => {
      const wordCount = (plugin as any).getWordCount('word1     word2     word3');
      expect(wordCount).toBe(3);
    });

    test('should handle text with mixed markdown and content', () => {
      const text = '# Header\n\n**Bold text** and *italic text* with `inline code`';
      const wordCount = (plugin as any).getWordCount(text);
      expect(wordCount).toBeGreaterThan(0);
    });

    test('should handle complex wiki links', () => {
      const text = '[[Complex Link|Display Text]] and [[Simple Link]]';
      const wordCount = (plugin as any).getWordCount(text);
      expect(wordCount).toBe(6); // "Complex Link Display Text and Simple Link"
    });

    test('should handle nested code blocks', () => {
      const text = '```\ncode block\nwith multiple lines\n```\nregular text';
      const wordCount = (plugin as any).getWordCount(text);
      expect(wordCount).toBe(2); // Only "regular text"
    });
  });

  describe('settings persistence', () => {
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

  describe('performance optimization', () => {
    test('should handle debounce timer cleanup on multiple calls', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Set initial timer
      (plugin as any).debounceTimer = setTimeout(() => { }, 1000);

      // Call debouncedUpdate which should clear the existing timer
      (plugin as any).debouncedUpdate();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    test('should handle null debounce timer', () => {
      (plugin as any).debounceTimer = null;

      // Should not throw error
      expect(() => (plugin as any).debouncedUpdate()).not.toThrow();
    });
  });

  describe('aria-label accessibility', () => {
    test('should set appropriate aria-label for word count display', () => {
      const mockEditor = {
        getSelection: jest.fn(() => ''),
        getValue: jest.fn(() => 'test content here'),
        getCursor: jest.fn((type?: string) => {
          return { line: 0, ch: 0 };
        })
      };

      mockApp.workspace.getActiveViewOfType.mockReturnValue({
        editor: mockEditor,
        getViewData: jest.fn(() => 'test content here')
      });

      plugin.settings.showWordCount = true;
      plugin.updateWordCount();

      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        expect.stringContaining('Words')
      );
    });

    test('should clear aria-label when no content', () => {
      mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

      plugin.updateWordCount();

      expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith('aria-label', '');
    });
  });
});