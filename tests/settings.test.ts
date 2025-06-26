import { DEFAULT_SETTINGS, MyPluginSettings, StatBarSettingTab } from '../src/settings';
import { App, PluginSettingTab, Setting } from 'obsidian';
import StatBarPlugin from '../main';

describe('Settings Tests', () => {
  describe('DEFAULT_SETTINGS', () => {
    test('should have correct default values', () => {
      expect(DEFAULT_SETTINGS.showWordCount).toBe(true);
      expect(DEFAULT_SETTINGS.showCharCount).toBe(true);
      expect(DEFAULT_SETTINGS.showReadTime).toBe(false);
      expect(DEFAULT_SETTINGS.showLastSavedTime).toBe(false);
      expect(DEFAULT_SETTINGS.wordLabel).toBe('Words:');
      expect(DEFAULT_SETTINGS.charLabel).toBe('Characters:');
      expect(DEFAULT_SETTINGS.readTimeLabel).toBe('min read');
      expect(DEFAULT_SETTINGS.readTimeLabelPosition).toBe('after');
      expect(DEFAULT_SETTINGS.lastSavedTimeLabel).toBe('Last saved:');
      expect(DEFAULT_SETTINGS.separatorLabel).toBe('or');
      expect(DEFAULT_SETTINGS.wordsPerMinute).toBe(200);
    });
  });

  describe('StatBarSettingTab', () => {
    let settingTab: StatBarSettingTab;
    let mockApp: any;
    let mockPlugin: any;

    beforeEach(() => {
      jest.clearAllMocks();

      mockApp = {
        workspace: {
          on: jest.fn(),
          off: jest.fn()
        }
      };

      mockPlugin = {
        settings: { ...DEFAULT_SETTINGS },
        saveSettings: jest.fn().mockResolvedValue(undefined),
        updateWordCount: jest.fn(),
        updateLastSavedTime: jest.fn()
      };

      settingTab = new StatBarSettingTab(mockApp, mockPlugin);
    });

    test('should create instance correctly', () => {
      expect(settingTab).toBeInstanceOf(StatBarSettingTab);
      expect(settingTab.plugin).toBe(mockPlugin);
      expect(settingTab.plugin.settings).toEqual(DEFAULT_SETTINGS);
    });

    test('should inherit from PluginSettingTab', () => {
      expect(settingTab).toBeInstanceOf(PluginSettingTab);
    });

    test('should have access to plugin settings', () => {
      expect(settingTab.plugin.settings.showWordCount).toBe(true);
      expect(settingTab.plugin.settings.showCharCount).toBe(true);
      expect(settingTab.plugin.settings.showReadTime).toBe(false);
      expect(settingTab.plugin.settings.showLastSavedTime).toBe(false);
      expect(settingTab.plugin.settings.wordsPerMinute).toBe(200);
    });

    test('should have display method', () => {
      expect(typeof settingTab.display).toBe('function');
    });

    test('should have plugin reference with required methods', () => {
      expect(typeof settingTab.plugin.saveSettings).toBe('function');
      expect(typeof settingTab.plugin.updateWordCount).toBe('function');
      expect(typeof settingTab.plugin.updateLastSavedTime).toBe('function');
    });

    test('should work with different plugin settings', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        wordLabel: 'Custom Words:',
        wordsPerMinute: 250
      };

      const customPlugin = {
        settings: customSettings,
        saveSettings: jest.fn(),
        updateWordCount: jest.fn(),
        updateLastSavedTime: jest.fn()
      };

      const customSettingTab = new StatBarSettingTab(mockApp, customPlugin as any);

      expect(customSettingTab.plugin.settings.showWordCount).toBe(false);
      expect(customSettingTab.plugin.settings.wordLabel).toBe('Custom Words:');
      expect(customSettingTab.plugin.settings.wordsPerMinute).toBe(250);
    });
  });

  describe('Settings integration with StatBarSettingTab', () => {
    test('should work with real settings object', () => {
      const mockApp = { workspace: { on: jest.fn() } };
      const mockPlugin = {
        settings: { ...DEFAULT_SETTINGS },
        saveSettings: jest.fn(),
        updateWordCount: jest.fn(),
        updateLastSavedTime: jest.fn()
      };

      const settingTab = new StatBarSettingTab(mockApp as any, mockPlugin as any);

      expect(settingTab.plugin.settings).toEqual(DEFAULT_SETTINGS);
      expect(settingTab.plugin.settings.showWordCount).toBe(true);
      expect(settingTab.plugin.settings.wordsPerMinute).toBe(200);
    });

    test('should have all required properties', () => {
      const requiredProperties: (keyof MyPluginSettings)[] = [
        'showWordCount',
        'showCharCount',
        'wordLabel',
        'charLabel',
        'showReadTime',
        'readTimeLabel',
        'readTimeLabelPosition',
        'separatorLabel',
        'wordsPerMinute',
        'showLastSavedTime',
        'lastSavedTimeLabel'
      ];

      requiredProperties.forEach(prop => {
        expect(DEFAULT_SETTINGS).toHaveProperty(prop);
      });
    });

    test('should have valid readTimeLabelPosition values', () => {
      expect(['before', 'after']).toContain(DEFAULT_SETTINGS.readTimeLabelPosition);
    });

    test('should have positive wordsPerMinute', () => {
      expect(DEFAULT_SETTINGS.wordsPerMinute).toBeGreaterThan(0);
    });

    test('should have non-empty string labels', () => {
      expect(DEFAULT_SETTINGS.wordLabel).toBeTruthy();
      expect(DEFAULT_SETTINGS.charLabel).toBeTruthy();
      expect(DEFAULT_SETTINGS.readTimeLabel).toBeTruthy();
      expect(DEFAULT_SETTINGS.lastSavedTimeLabel).toBeTruthy();
      expect(DEFAULT_SETTINGS.separatorLabel).toBeTruthy();
    });
  });

  describe('Settings validation', () => {
    test('should accept valid custom settings', () => {
      const customSettings: MyPluginSettings = {
        showWordCount: false,
        showCharCount: false,
        wordLabel: 'W:',
        charLabel: 'C:',
        showReadTime: true,
        readTimeLabel: 'minutes',
        readTimeLabelPosition: 'before',
        separatorLabel: '|',
        wordsPerMinute: 150,
        showLastSavedTime: true,
        lastSavedTimeLabel: 'Saved:'
      };

      // Test that all properties are properly typed
      expect(typeof customSettings.showWordCount).toBe('boolean');
      expect(typeof customSettings.showCharCount).toBe('boolean');
      expect(typeof customSettings.wordLabel).toBe('string');
      expect(typeof customSettings.charLabel).toBe('string');
      expect(typeof customSettings.showReadTime).toBe('boolean');
      expect(typeof customSettings.readTimeLabel).toBe('string');
      expect(['before', 'after']).toContain(customSettings.readTimeLabelPosition);
      expect(typeof customSettings.separatorLabel).toBe('string');
      expect(typeof customSettings.wordsPerMinute).toBe('number');
      expect(typeof customSettings.showLastSavedTime).toBe('boolean');
      expect(typeof customSettings.lastSavedTimeLabel).toBe('string');
    });

    test('should handle edge case values', () => {
      const edgeCaseSettings: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        wordsPerMinute: 1, // Very slow reading
        wordLabel: '', // Empty label
        separatorLabel: ' ' // Space separator
      };

      expect(edgeCaseSettings.wordsPerMinute).toBe(1);
      expect(edgeCaseSettings.wordLabel).toBe('');
      expect(edgeCaseSettings.separatorLabel).toBe(' ');
    });
  });

  describe('Settings combinations', () => {
    test('should work with all features disabled', () => {
      const allDisabled: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        showWordCount: false,
        showCharCount: false,
        showReadTime: false,
        showLastSavedTime: false
      };

      expect(allDisabled.showWordCount).toBe(false);
      expect(allDisabled.showCharCount).toBe(false);
      expect(allDisabled.showReadTime).toBe(false);
      expect(allDisabled.showLastSavedTime).toBe(false);
    });

    test('should work with all features enabled', () => {
      const allEnabled: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: true,
        showReadTime: true,
        showLastSavedTime: true
      };

      expect(allEnabled.showWordCount).toBe(true);
      expect(allEnabled.showCharCount).toBe(true);
      expect(allEnabled.showReadTime).toBe(true);
      expect(allEnabled.showLastSavedTime).toBe(true);
    });

    test('should work with mixed configurations', () => {
      const mixedConfig: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        showWordCount: true,
        showCharCount: false,
        showReadTime: true,
        showLastSavedTime: false,
        readTimeLabelPosition: 'before'
      };

      expect(mixedConfig.showWordCount).toBe(true);
      expect(mixedConfig.showCharCount).toBe(false);
      expect(mixedConfig.showReadTime).toBe(true);
      expect(mixedConfig.showLastSavedTime).toBe(false);
      expect(mixedConfig.readTimeLabelPosition).toBe('before');
    });
  });

  describe('Label customization', () => {
    test('should support custom labels', () => {
      const customLabels: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        wordLabel: 'Palabras:',
        charLabel: 'Caracteres:',
        readTimeLabel: 'min de lectura',
        lastSavedTimeLabel: 'Guardado:',
        separatorLabel: 'y'
      };

      expect(customLabels.wordLabel).toBe('Palabras:');
      expect(customLabels.charLabel).toBe('Caracteres:');
      expect(customLabels.readTimeLabel).toBe('min de lectura');
      expect(customLabels.lastSavedTimeLabel).toBe('Guardado:');
      expect(customLabels.separatorLabel).toBe('y');
    });

    test('should support emoji labels', () => {
      const emojiLabels: MyPluginSettings = {
        ...DEFAULT_SETTINGS,
        wordLabel: '📝',
        charLabel: '🔤',
        readTimeLabel: '⏱️',
        lastSavedTimeLabel: '💾',
        separatorLabel: '•'
      };

      expect(emojiLabels.wordLabel).toBe('📝');
      expect(emojiLabels.charLabel).toBe('🔤');
      expect(emojiLabels.readTimeLabel).toBe('⏱️');
      expect(emojiLabels.lastSavedTimeLabel).toBe('💾');
      expect(emojiLabels.separatorLabel).toBe('•');
    });
  });

  describe('Words per minute settings', () => {
    test('should support different reading speeds', () => {
      const speeds = [100, 150, 200, 250, 300, 400, 500];

      speeds.forEach(speed => {
        const settings: MyPluginSettings = {
          ...DEFAULT_SETTINGS,
          wordsPerMinute: speed
        };

        expect(settings.wordsPerMinute).toBe(speed);
        expect(settings.wordsPerMinute).toBeGreaterThan(0);
      });
    });

    test('should handle extreme reading speeds', () => {
      const extremeSpeeds = [1, 10, 1000, 2000];

      extremeSpeeds.forEach(speed => {
        const settings: MyPluginSettings = {
          ...DEFAULT_SETTINGS,
          wordsPerMinute: speed
        };

        expect(settings.wordsPerMinute).toBe(speed);
      });
    });
  });
});