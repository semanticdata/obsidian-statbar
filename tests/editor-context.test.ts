jest.mock("obsidian");

import { getEditorContext } from "../src/editor-context";

describe("EditorContext Service", () => {
	let mockApp: any;

	beforeEach(() => {
		mockApp = {
			workspace: {
				getActiveViewOfType: jest.fn(),
			},
		};
	});

	test("should return no active view when no markdown view exists", () => {
		mockApp.workspace.getActiveViewOfType.mockReturnValue(null);

		const context = getEditorContext(mockApp);

		expect(context.hasActiveView).toBe(false);
		expect(context.hasSelection).toBe(false);
		expect(context.isSelection).toBe(false);
		expect(context.selectedText).toBe("");
		expect(context.fullText).toBe("");
		expect(context.currentText).toBe("");
		expect(context.charCount).toBe(0);
		expect(context.charNoSpaces).toBe(0);
	});

	test("should detect no selection when cursors are at same position", () => {
		const mockEditor = {
			getCursor: jest.fn((type?: string) => ({ line: 0, ch: 5 })),
			getSelection: jest.fn(() => ""),
		};

		const mockView = {
			editor: mockEditor,
			getViewData: jest.fn(() => "This is test content"),
		};

		mockApp.workspace.getActiveViewOfType.mockReturnValue(mockView);

		const context = getEditorContext(mockApp);

		expect(context.hasActiveView).toBe(true);
		expect(context.hasSelection).toBe(false);
		expect(context.isSelection).toBe(false);
		expect(context.selectedText).toBe("");
		expect(context.fullText).toBe("This is test content");
		expect(context.currentText).toBe("This is test content");
		expect(context.charCount).toBe(20);
		expect(context.charNoSpaces).toBe(17);
	});

	test("should detect selection when cursors are at different positions", () => {
		const mockEditor = {
			getCursor: jest.fn((type?: string) => {
				if (type === "from") return { line: 0, ch: 0 };
				if (type === "to") return { line: 0, ch: 4 };
				return { line: 0, ch: 0 };
			}),
			getSelection: jest.fn(() => "This"),
		};

		const mockView = {
			editor: mockEditor,
			getViewData: jest.fn(() => "This is test content"),
		};

		mockApp.workspace.getActiveViewOfType.mockReturnValue(mockView);

		const context = getEditorContext(mockApp);

		expect(context.hasActiveView).toBe(true);
		expect(context.hasSelection).toBe(true);
		expect(context.isSelection).toBe(true);
		expect(context.selectedText).toBe("This");
		expect(context.fullText).toBe("This is test content");
		expect(context.currentText).toBe("This");
		expect(context.charCount).toBe(4);
		expect(context.charNoSpaces).toBe(4);
	});

	test("should handle selection with whitespace correctly", () => {
		const mockEditor = {
			getCursor: jest.fn((type?: string) => {
				if (type === "from") return { line: 0, ch: 0 };
				if (type === "to") return { line: 0, ch: 7 };
				return { line: 0, ch: 0 };
			}),
			getSelection: jest.fn(() => "This is"),
		};

		const mockView = {
			editor: mockEditor,
			getViewData: jest.fn(() => "This is test content"),
		};

		mockApp.workspace.getActiveViewOfType.mockReturnValue(mockView);

		const context = getEditorContext(mockApp);

		expect(context.hasActiveView).toBe(true);
		expect(context.hasSelection).toBe(true);
		expect(context.isSelection).toBe(true);
		expect(context.selectedText).toBe("This is");
		expect(context.fullText).toBe("This is test content");
		expect(context.currentText).toBe("This is");
		expect(context.charCount).toBe(7);
		expect(context.charNoSpaces).toBe(6);
	});

	test("should handle empty selection correctly", () => {
		const mockEditor = {
			getCursor: jest.fn((type?: string) => {
				if (type === "from") return { line: 0, ch: 0 };
				if (type === "to") return { line: 0, ch: 4 };
				return { line: 0, ch: 0 };
			}),
			getSelection: jest.fn(() => ""), // Empty selection
		};

		const mockView = {
			editor: mockEditor,
			getViewData: jest.fn(() => "This is test content"),
		};

		mockApp.workspace.getActiveViewOfType.mockReturnValue(mockView);

		const context = getEditorContext(mockApp);

		expect(context.hasActiveView).toBe(true);
		expect(context.hasSelection).toBe(true);
		expect(context.isSelection).toBe(false); // No actual content selected
		expect(context.selectedText).toBe("");
		expect(context.fullText).toBe("This is test content");
		expect(context.currentText).toBe("This is test content"); // Falls back to full text
		expect(context.charCount).toBe(20);
		expect(context.charNoSpaces).toBe(17);
	});
});