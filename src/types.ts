export interface DocumentStats {
	wordCount: number;
	charCount: number;
	readTime: string;
	isSelection?: boolean;
	selectionPrefix?: string;
}

export interface EditorContext {
	hasActiveView: boolean;
	hasSelection: boolean;
	isSelection: boolean;
	selectedText: string;
	fullText: string;
	currentText: string;
	charCount: number;
	charNoSpaces: number;
	cursorLine: number;
	cursorCharacter: number;
}

export type ReadTimeLabelPosition = "before" | "after";

export interface MyPluginSettings {
	showWordCount: boolean;
	showCharCount: boolean;
	wordLabel: string;
	charLabel: string;
	showReadTime: boolean;
	readTimeLabel: string;
	readTimeLabelPosition: ReadTimeLabelPosition;
	separatorLabel: string;
	wordsPerMinute: number;
	showLastSavedTime: boolean;
	lastSavedTimeLabel: string;
	showSelectionStats: boolean;
	selectionPrefix: string;
	showCursorLocation: boolean;
	cursorLocationLabel: string;
	cursorLocationFormat: string;
}
