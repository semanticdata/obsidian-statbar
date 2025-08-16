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

	beforeEach(() => {
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
			const text = "This is an example, e.g., of abbreviations like i.e. and etc.";
			const result = getWordCount(text);
			expect(result).toBe(11); // 'This is an example e.g of abbreviations like i.e and etc'
		});

		test("should handle contractions properly", () => {
			const text = "I can't believe it's working! We're testing don't and won't.";
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

	describe("content hashing and caching", () => {
		test("should generate consistent hash for same content", () => {
			const content = "This is test content";
			const hash1 = (plugin as any).getContentHash(content);
			const hash2 = (plugin as any).getContentHash(content);
			expect(hash1).toBe(hash2);
		});

		test("should generate different hash for different content", () => {
			const content1 = "This is test content";
			const content2 = "This is different content";
			const hash1 = (plugin as any).getContentHash(content1);
			const hash2 = (plugin as any).getContentHash(content2);
			expect(hash1).not.toBe(hash2);
		});

		test("should cache and retrieve stats correctly", () => {
			const hash = "test-hash";
			const stats = {
				wordCount: 100,
				charCount: 500,
				readTime: "0:30",
				isSelection: false,
			};

			(plugin as any).setCachedStats(hash, stats);
			const retrieved = (plugin as any).getCachedStats(hash);
			expect(retrieved).toEqual(stats);
		});

		test("should return null for non-existent cache", () => {
			const retrieved = (plugin as any).getCachedStats(
				"non-existent-hash",
			);
			expect(retrieved).toBeNull();
		});
	});
});
