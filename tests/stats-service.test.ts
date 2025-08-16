jest.mock("obsidian");
jest.mock("../src/stats");

import { StatsService } from "../src/stats-service";
import { EditorContext } from "../src/editor-context";
import { MyPluginSettings, DEFAULT_SETTINGS } from "../src/settings";
import { getWordCount, calculateReadTime } from "../src/stats";

const mockGetWordCount = getWordCount as jest.MockedFunction<typeof getWordCount>;
const mockCalculateReadTime = calculateReadTime as jest.MockedFunction<typeof calculateReadTime>;

describe("StatsService", () => {
	let statsService: StatsService;
	let mockSettings: MyPluginSettings;

	beforeEach(() => {
		jest.clearAllMocks();
		statsService = new StatsService();
		mockSettings = { ...DEFAULT_SETTINGS };
		
		mockGetWordCount.mockReturnValue(10);
		mockCalculateReadTime.mockReturnValue("0:30");
	});

	test("should return zero stats when no active view", () => {
		const context: EditorContext = {
			hasActiveView: false,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "",
			currentText: "",
			charCount: 0,
			charNoSpaces: 0,
		};

		const stats = statsService.calculateStats(context, mockSettings);

		expect(stats).toEqual({
			wordCount: 0,
			charCount: 0,
			readTime: "0:00",
			isSelection: false,
		});
		expect(mockGetWordCount).not.toHaveBeenCalled();
		expect(mockCalculateReadTime).not.toHaveBeenCalled();
	});

	test("should calculate stats for document text", () => {
		const context: EditorContext = {
			hasActiveView: true,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "This is test content",
			currentText: "This is test content",
			charCount: 20,
			charNoSpaces: 16,
		};

		const stats = statsService.calculateStats(context, mockSettings);

		expect(stats).toEqual({
			wordCount: 10,
			charCount: 20,
			readTime: "0:30",
			isSelection: false,
		});
		expect(mockGetWordCount).toHaveBeenCalledWith("This is test content");
		expect(mockCalculateReadTime).toHaveBeenCalledWith(10, mockSettings.wordsPerMinute);
	});

	test("should calculate stats for selected text", () => {
		const context: EditorContext = {
			hasActiveView: true,
			hasSelection: true,
			isSelection: true,
			selectedText: "selected",
			fullText: "This is test content",
			currentText: "selected",
			charCount: 8,
			charNoSpaces: 8,
		};

		const stats = statsService.calculateStats(context, mockSettings);

		expect(stats).toEqual({
			wordCount: 10,
			charCount: 8,
			readTime: "0:30",
			isSelection: true,
		});
		expect(mockGetWordCount).toHaveBeenCalledWith("selected");
		expect(mockCalculateReadTime).toHaveBeenCalledWith(10, mockSettings.wordsPerMinute);
	});

	test("should cache document stats and return cached result", () => {
		const context: EditorContext = {
			hasActiveView: true,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "This is test content",
			currentText: "This is test content",
			charCount: 20,
			charNoSpaces: 16,
		};

		// First call - should calculate
		const stats1 = statsService.calculateStats(context, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(1);

		// Second call with same content - should use cache
		const stats2 = statsService.calculateStats(context, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(1); // Not called again
		expect(stats1).toEqual(stats2);
	});

	test("should cache selection stats separately from document stats", () => {
		const documentContext: EditorContext = {
			hasActiveView: true,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "This is test content",
			currentText: "This is test content",
			charCount: 20,
			charNoSpaces: 16,
		};

		const selectionContext: EditorContext = {
			hasActiveView: true,
			hasSelection: true,
			isSelection: true,
			selectedText: "selected",
			fullText: "This is test content",
			currentText: "selected",
			charCount: 8,
			charNoSpaces: 8,
		};

		// Calculate document stats
		statsService.calculateStats(documentContext, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(1);

		// Calculate selection stats - should not use document cache
		statsService.calculateStats(selectionContext, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(2);

		// Calculate document stats again - should use document cache
		statsService.calculateStats(documentContext, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(2);

		// Calculate selection stats again - should use selection cache
		statsService.calculateStats(selectionContext, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(2);
	});

	test("should calculate full document stats correctly", () => {
		const fullText = "This is a full document text";
		mockGetWordCount.mockReturnValue(6);
		mockCalculateReadTime.mockReturnValue("1:30");

		const stats = statsService.calculateFullDocumentStats(fullText, mockSettings);

		expect(stats).toEqual({
			wordCount: 6,
			charCount: 28,
			readTime: "1:30",
			isSelection: false,
		});
		expect(mockGetWordCount).toHaveBeenCalledWith(fullText);
		expect(mockCalculateReadTime).toHaveBeenCalledWith(6, mockSettings.wordsPerMinute);
	});

	test("should recalculate when content changes", () => {
		const context1: EditorContext = {
			hasActiveView: true,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "First content",
			currentText: "First content",
			charCount: 13,
			charNoSpaces: 12,
		};

		const context2: EditorContext = {
			hasActiveView: true,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "Different content",
			currentText: "Different content",
			charCount: 17,
			charNoSpaces: 16,
		};

		// First calculation
		statsService.calculateStats(context1, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(1);

		// Second calculation with different content
		statsService.calculateStats(context2, mockSettings);
		expect(mockGetWordCount).toHaveBeenCalledTimes(2);
	});
});