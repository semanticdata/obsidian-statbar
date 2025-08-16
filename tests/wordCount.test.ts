// Mock Obsidian API before importing
jest.mock("obsidian");

import { PluginManifest } from "obsidian";
import StatBarPlugin from "../main";
import { DEFAULT_SETTINGS } from "../src/settings";
import { getWordCount, calculateReadTime } from "../src/stats";

describe("StatBarPlugin Word Count Tests", () => {
	let plugin: StatBarPlugin;
	let mockApp: any;
	let mockManifest: PluginManifest;
	let mockStatusBarItem: any;

	beforeEach(() => {
		mockStatusBarItem = document.createElement("div");
		(mockStatusBarItem as any).setText = jest.fn();
		(mockStatusBarItem as any).setTitle = jest.fn();
		(mockStatusBarItem as any).addClass = jest.fn();
		(mockStatusBarItem as any).removeClass = jest.fn();
		(mockStatusBarItem as any).setAttribute = jest.fn();
		(mockStatusBarItem as any).remove = jest.fn();
		mockApp = {
			workspace: {
				on: jest.fn(),
				off: jest.fn(),
				getActiveFile: jest.fn(),
				getActiveViewOfType: jest.fn(() => ({
					editor: {
						getValue: jest.fn(() => "Sample text for testing"),
						getSelection: jest.fn(() => ""),
						getCursor: jest.fn((type?: string) => {
							return { line: 0, ch: 0 };
						}),
					},
					getViewData: jest.fn(() => "Sample text for testing"),
				})),
			},
			vault: {
				on: jest.fn(),
				off: jest.fn(),
			},
		};

		mockManifest = {
			id: "test-statbar",
			name: "Test StatBar",
			version: "1.0.0",
			minAppVersion: "0.15.0",
			description: "Test plugin",
			author: "Test Author",
		};

		plugin = new StatBarPlugin(mockApp, mockManifest);
		plugin.settings = { ...DEFAULT_SETTINGS };

		// Mock plugin methods
		plugin.registerEvent = jest.fn();
		plugin.registerDomEvent = jest.fn();
	});

	describe("getWordCount", () => {
		test("should count simple words correctly", () => {
			const text = "Hello world this is a test";
			const result = getWordCount(text);
			expect(result).toBe(6);
		});

		test("should handle empty string", () => {
			const text = "";
			const result = getWordCount(text);
			expect(result).toBe(0);
		});

		test("should handle whitespace only", () => {
			const text = "   \n\t   ";
			const result = getWordCount(text);
			expect(result).toBe(0);
		});

		test("should remove wiki links and count content", () => {
			const text = "This is a [[wiki link]] in text";
			const result = getWordCount(text);
			expect(result).toBe(7); // 'This is a wiki link in text'
		});

		test("should remove markdown links and count content", () => {
			const text =
				"This is a [markdown link](https://example.com) in text";
			const result = getWordCount(text);
			expect(result).toBe(7); // 'This is a markdown link in text'
		});

		test("should remove code blocks", () => {
			const text =
				"Before code\n```\nconst x = 1;\nconsole.log(x);\n```\nAfter code";
			const result = getWordCount(text);
			expect(result).toBe(4); // 'Before code After code'
		});

		test("should remove inline code", () => {
			const text = "This has `inline code` in it";
			const result = getWordCount(text);
			expect(result).toBe(4); // 'This has in it'
		});

		test("should remove markdown syntax", () => {
			const text =
				"# Heading\n**bold** *italic* `code` ~~strikethrough~~ > quote";
			const result = getWordCount(text);
			expect(result).toBe(5); // 'Heading bold italic strikethrough quote'
		});

		test("should handle complex mixed content", () => {
			const text = `# My Document
      
      This is a paragraph with [[wiki links]] and [markdown links](https://example.com).
      
      \`\`\`javascript
      const code = "should be ignored";
      \`\`\`
      
      More text with **bold** and *italic* formatting.`;

			const result = getWordCount(text);
			// Expected: 'My Document This is a paragraph with wiki links and markdown links More text with bold and italic formatting'
			expect(result).toBe(19);
		});

		test("should normalize multiple spaces", () => {
			const text = "Word1    Word2\n\n\nWord3\t\tWord4";
			const result = getWordCount(text);
			expect(result).toBe(4);
		});

		test("should handle special characters", () => {
			const text = "Hello, world! How are you? I'm fine.";
			const result = getWordCount(text);
			expect(result).toBe(7); // 'Hello, world! How are you? I'm fine.'
		});

		test("should preserve abbreviations correctly", () => {
			const text =
				"This is an example, e.g., of abbreviations like i.e. and etc.";
			const result = getWordCount(text);
			expect(result).toBe(11); // 'This is an example e.g of abbreviations like i.e and etc'
		});

		test("should handle contractions properly", () => {
			const text =
				"I can't believe it's working! We're testing don't and won't.";
			const result = getWordCount(text);
			expect(result).toBe(10); // 'I can't believe it's working We're testing don't and won't'
		});
	});

	describe("calculateReadTime", () => {
		test("should calculate read time correctly for default WPM", () => {
			plugin.settings.wordsPerMinute = 200;
			const result = calculateReadTime(
				400,
				plugin.settings.wordsPerMinute,
			);
			expect(result).toBe("2:00"); // 400 words / 200 WPM = 2 minutes
		});

		test("should handle fractional minutes", () => {
			plugin.settings.wordsPerMinute = 200;
			const result = calculateReadTime(
				300,
				plugin.settings.wordsPerMinute,
			);
			expect(result).toBe("1:30"); // 300 words / 200 WPM = 1.5 minutes = 1:30
		});

		test("should handle less than one minute", () => {
			plugin.settings.wordsPerMinute = 200;
			const result = calculateReadTime(
				50,
				plugin.settings.wordsPerMinute,
			);
			expect(result).toBe("0:15"); // 50 words / 200 WPM = 0.25 minutes = 15 seconds
		});

		test("should handle zero words", () => {
			plugin.settings.wordsPerMinute = 200;
			const result = calculateReadTime(0, plugin.settings.wordsPerMinute);
			expect(result).toBe("0:00");
		});

		test("should handle custom WPM setting", () => {
			plugin.settings.wordsPerMinute = 150;
			const result = calculateReadTime(
				300,
				plugin.settings.wordsPerMinute,
			);
			expect(result).toBe("2:00"); // 300 words / 150 WPM = 2 minutes
		});

		test("should round seconds correctly", () => {
			plugin.settings.wordsPerMinute = 200;
			const result = calculateReadTime(
				333,
				plugin.settings.wordsPerMinute,
			);
			// 333 words / 200 WPM = 1.665 minutes = 1 minute 40 seconds (rounded)
			expect(result).toBe("1:40");
		});
	});

	describe("stats service integration", () => {
		test("should calculate stats correctly", () => {
			const mockEditor = {
				getSelection: jest.fn(() => ""),
				getValue: jest.fn(() => "test content"),
				getCursor: jest.fn((type?: string) => {
					return { line: 0, ch: 0 };
				}),
			};

			mockApp.workspace.getActiveViewOfType.mockReturnValue({
				editor: mockEditor,
				getViewData: jest.fn(() => "test content"),
			});

			// Ensure statusBarItemEl is properly mocked
			plugin.statusBarItemEl = mockStatusBarItem;

			plugin.updateWordCount();

			expect(mockStatusBarItem.setText).toHaveBeenCalled();
			const setTextCall = mockStatusBarItem.setText.mock.calls[0][0];
			expect(typeof setTextCall).toBe("string");
		});

		test("should handle caching within stats service", () => {
			const mockEditor = {
				getSelection: jest.fn(() => ""),
				getValue: jest.fn(() => "test content"),
				getCursor: jest.fn((type?: string) => {
					return { line: 0, ch: 0 };
				}),
			};

			mockApp.workspace.getActiveViewOfType.mockReturnValue({
				editor: mockEditor,
				getViewData: jest.fn(() => "test content"),
			});

			// Ensure statusBarItemEl is properly mocked
			plugin.statusBarItemEl = mockStatusBarItem;

			// Multiple calls should work without error
			plugin.updateWordCount();
			plugin.updateWordCount();

			expect(mockStatusBarItem.setText).toHaveBeenCalledTimes(2);
		});
	});
});
