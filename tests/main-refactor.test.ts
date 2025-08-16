jest.mock("obsidian");

import { PluginManifest } from "obsidian";
import StatBarPlugin from "../main";
import { DEFAULT_SETTINGS } from "../src/settings";
import { EditorContext } from "../src/editor-context";
import { DocumentStats } from "../src/types";

describe("StatBarPlugin Refactored Methods", () => {
	let plugin: StatBarPlugin;
	let mockApp: any;
	let mockManifest: PluginManifest;
	let mockStatusBarItem: any;

	beforeEach(() => {
		mockStatusBarItem = document.createElement("div");
		(mockStatusBarItem as any).setText = jest.fn();
		(mockStatusBarItem as any).setAttribute = jest.fn();
		(mockStatusBarItem as any).addClass = jest.fn();

		mockApp = {
			workspace: {
				on: jest.fn(),
				off: jest.fn(),
				getActiveFile: jest.fn(),
				getActiveViewOfType: jest.fn(),
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
		plugin.statusBarItemEl = mockStatusBarItem;

		// Mock plugin methods
		plugin.registerEvent = jest.fn();
		plugin.registerDomEvent = jest.fn();
		plugin.addStatusBarItem = jest.fn().mockReturnValue(mockStatusBarItem);
	});

	describe("clearStatusBar", () => {
		test("should clear status bar text and aria-label", () => {
			(plugin as any).clearStatusBar();

			expect(mockStatusBarItem.setText).toHaveBeenCalledWith("");
			expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith("aria-label", "");
		});
	});

	describe("buildStatusText", () => {
		let context: EditorContext;
		let stats: DocumentStats;

		beforeEach(() => {
			context = {
				hasActiveView: true,
				hasSelection: false,
				isSelection: false,
				selectedText: "",
				fullText: "Test content",
				currentText: "Test content",
				charCount: 12,
				charNoSpaces: 11,
			};

			stats = {
				wordCount: 2,
				charCount: 12,
				readTime: "0:30",
				isSelection: false,
			};
		});

		test("should build status text with word count only", () => {
			plugin.settings.showWordCount = true;
			plugin.settings.showCharCount = false;
			plugin.settings.showReadTime = false;

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("Words: 2");
		});

		test("should build status text with word count and character count", () => {
			plugin.settings.showWordCount = true;
			plugin.settings.showCharCount = true;
			plugin.settings.showReadTime = false;
			plugin.settings.separatorLabel = " | ";

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("Words: 2  |  Characters: 12");
		});

		test("should build status text with all stats enabled", () => {
			plugin.settings.showWordCount = true;
			plugin.settings.showCharCount = true;
			plugin.settings.showReadTime = true;
			plugin.settings.separatorLabel = " | ";
			plugin.settings.readTimeLabelPosition = "after";
			plugin.settings.readTimeLabel = "min read";

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("Words: 2  |  Characters: 12  |  0:30 min read");
		});

		test("should include selection prefix when text is selected", () => {
			context.isSelection = true;
			plugin.settings.showSelectionStats = true;
			plugin.settings.selectionPrefix = "📝";
			plugin.settings.showWordCount = true;
			plugin.settings.showCharCount = false;
			plugin.settings.showReadTime = false;

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("📝 Words: 2");
		});

		test("should position read time label before when configured", () => {
			plugin.settings.showWordCount = false;
			plugin.settings.showCharCount = false;
			plugin.settings.showReadTime = true;
			plugin.settings.readTimeLabelPosition = "before";
			plugin.settings.readTimeLabel = "min read";

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("min read 0:30");
		});

		test("should return empty string when all stats disabled", () => {
			plugin.settings.showWordCount = false;
			plugin.settings.showCharCount = false;
			plugin.settings.showReadTime = false;

			const result = (plugin as any).buildStatusText(context, stats);

			expect(result).toBe("");
		});
	});

	describe("buildTooltip", () => {
		let context: EditorContext;
		let stats: DocumentStats;

		beforeEach(() => {
			context = {
				hasActiveView: true,
				hasSelection: false,
				isSelection: false,
				selectedText: "",
				fullText: "Test content",
				currentText: "Test content",
				charCount: 12,
				charNoSpaces: 11,
			};

			stats = {
				wordCount: 2,
				charCount: 12,
				readTime: "0:30",
				isSelection: false,
			};
		});

		test("should build tooltip for document stats", () => {
			const result = (plugin as any).buildTooltip(context, stats);

			expect(result).toBe(
				"Document Stats:\n" +
				"Full document\n" +
				"Words: 2\n" +
				"Characters: 12 (11 no spaces)\n" +
				"Estimated Read Time: 0:30 minutes"
			);
		});

		test("should build tooltip for selection stats", () => {
			context.isSelection = true;
			context.selectedText = "Test";
			plugin.settings.showSelectionStats = true;

			const result = (plugin as any).buildTooltip(context, stats);

			expect(result).toBe(
				"Selection Stats:\n" +
				"Selected text (4 chars)\n" +
				"Words: 2\n" +
				"Characters: 12 (11 no spaces)\n" +
				"Estimated Read Time: 0:30 minutes"
			);
		});
	});

	describe("updateStatusBarDisplay", () => {
		test("should update status bar with text and tooltip", () => {
			const statusText = "Words: 5";
			const tooltip = "Document Stats:\nWords: 5";

			(plugin as any).updateStatusBarDisplay(statusText, tooltip);

			expect(mockStatusBarItem.setText).toHaveBeenCalledWith(statusText);
			expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith("aria-label", tooltip);
		});

		test("should clear aria-label when status text is empty", () => {
			const statusText = "";
			const tooltip = "";

			(plugin as any).updateStatusBarDisplay(statusText, tooltip);

			expect(mockStatusBarItem.setText).toHaveBeenCalledWith("");
			expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith("aria-label", "");
		});

		test("should handle status text with only whitespace", () => {
			const statusText = "   ";
			const tooltip = "";

			(plugin as any).updateStatusBarDisplay(statusText, tooltip);

			expect(mockStatusBarItem.setText).toHaveBeenCalledWith("   ");
			expect(mockStatusBarItem.setAttribute).toHaveBeenCalledWith("aria-label", "");
		});
	});
});