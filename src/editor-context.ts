import { App, MarkdownView } from "obsidian";
import { EditorContext } from "./types";

export function getEditorContext(app: App): EditorContext {
	const activeView = app.workspace.getActiveViewOfType(MarkdownView);

	if (!activeView) {
		return {
			hasActiveView: false,
			hasSelection: false,
			isSelection: false,
			selectedText: "",
			fullText: "",
			currentText: "",
			charCount: 0,
			charNoSpaces: 0,
			cursorLine: 0,
			cursorCharacter: 0,
		};
	}

	const editor = activeView.editor;

	// Check if there's an actual selection by comparing cursor positions
	const fromCursor = editor.getCursor("from");
	const toCursor = editor.getCursor("to");
	const hasSelection =
		fromCursor.line !== toCursor.line || fromCursor.ch !== toCursor.ch;

	const selectedText = hasSelection ? editor.getSelection() : "";
	const fullText = activeView.getViewData();
	const isSelection = hasSelection && selectedText.length > 0;
	const currentText = isSelection ? selectedText : fullText;

	// Get cursor position (use "from" cursor for selections, main cursor otherwise)
	const cursor = hasSelection ? fromCursor : editor.getCursor();
	const cursorLine = cursor.line + 1; // Convert to 1-based indexing
	const cursorCharacter = cursor.ch + 1; // Convert to 1-based indexing

	return {
		hasActiveView: true,
		hasSelection,
		isSelection,
		selectedText,
		fullText,
		currentText,
		charCount: currentText.length,
		charNoSpaces: currentText.replace(/\s/g, "").length,
		cursorLine,
		cursorCharacter,
	};
}
