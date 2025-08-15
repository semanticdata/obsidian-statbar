import { App, Modal, MarkdownView } from "obsidian";
import StatBarPlugin from "../main";
import { getWordCount, calculateReadTime } from "./stats";

export class DetailedStatsModal extends Modal {
	plugin: StatBarPlugin;

	constructor(app: App, plugin: StatBarPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Get current stats
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			contentEl.createEl('p', { text: 'No active markdown file' });
			return;
		}

		const editor = activeView.editor;
		const fromCursor = editor.getCursor('from');
		const toCursor = editor.getCursor('to');
		const hasSelection = fromCursor.line !== toCursor.line || fromCursor.ch !== toCursor.ch;
		const selectedText = hasSelection ? editor.getSelection() : '';
		const fullText = activeView.getViewData();
		const isSelection = hasSelection && selectedText.length > 0;

		// Calculate stats for both selection and full document
		const currentText = isSelection ? selectedText : fullText;
		const wordCount = getWordCount(currentText);
		const charCount = currentText.length;
		const charNoSpaces = currentText.replace(/\s/g, '').length;
		const readTime = calculateReadTime(wordCount, this.plugin.settings.wordsPerMinute);

		// Current scope indicator (serves as main header)
		if (isSelection) {
			const scopeEl = contentEl.createEl('div', { cls: 'statbar-modal-scope' });
			scopeEl.createEl('strong', { text: '📝 Selection Statistics' });
			scopeEl.createEl('p', { text: `Analyzing selected text (${selectedText.length} characters)` });
		} else {
			const scopeEl = contentEl.createEl('div', { cls: 'statbar-modal-scope' });
			scopeEl.createEl('strong', { text: '📄 Document Statistics' });
			scopeEl.createEl('p', { text: 'Analyzing entire document' });
		}

		// Stats container
		const statsContainer = contentEl.createEl('div', { cls: 'statbar-modal-stats' });

		// Word count
		const wordEl = statsContainer.createEl('div', { cls: 'statbar-stat-item' });
		wordEl.createEl('span', { text: 'Words: ', cls: 'statbar-stat-label' });
		wordEl.createEl('span', { text: wordCount.toLocaleString(), cls: 'statbar-stat-value' });

		// Character count
		const charEl = statsContainer.createEl('div', { cls: 'statbar-stat-item' });
		charEl.createEl('span', { text: 'Characters: ', cls: 'statbar-stat-label' });
		charEl.createEl('span', { text: charCount.toLocaleString(), cls: 'statbar-stat-value' });

		// Character count (no spaces)
		const charNoSpacesEl = statsContainer.createEl('div', { cls: 'statbar-stat-item' });
		charNoSpacesEl.createEl('span', { text: 'Characters (no spaces): ', cls: 'statbar-stat-label' });
		charNoSpacesEl.createEl('span', { text: charNoSpaces.toLocaleString(), cls: 'statbar-stat-value' });

		// Read time
		const readTimeEl = statsContainer.createEl('div', { cls: 'statbar-stat-item' });
		readTimeEl.createEl('span', { text: 'Estimated read time: ', cls: 'statbar-stat-label' });
		readTimeEl.createEl('span', { text: `${readTime} minutes`, cls: 'statbar-stat-value' });

		// Reading speed info
		const speedEl = statsContainer.createEl('div', { cls: 'statbar-stat-item statbar-stat-info' });
		speedEl.createEl('span', { text: `Based on ${this.plugin.settings.wordsPerMinute} words per minute`, cls: 'statbar-stat-note' });

		// If there's a selection, also show document stats
		if (isSelection) {
			const fullWordCount = getWordCount(fullText);
			const fullCharCount = fullText.length;
			const fullReadTime = calculateReadTime(fullWordCount, this.plugin.settings.wordsPerMinute);

			contentEl.createEl('hr');
			contentEl.createEl('h3', { text: '📄 Full Document Statistics' });

			const fullStatsContainer = contentEl.createEl('div', { cls: 'statbar-modal-stats' });

			const fullWordEl = fullStatsContainer.createEl('div', { cls: 'statbar-stat-item' });
			fullWordEl.createEl('span', { text: 'Words: ', cls: 'statbar-stat-label' });
			fullWordEl.createEl('span', { text: fullWordCount.toLocaleString(), cls: 'statbar-stat-value' });

			const fullCharEl = fullStatsContainer.createEl('div', { cls: 'statbar-stat-item' });
			fullCharEl.createEl('span', { text: 'Characters: ', cls: 'statbar-stat-label' });
			fullCharEl.createEl('span', { text: fullCharCount.toLocaleString(), cls: 'statbar-stat-value' });

			const fullReadTimeEl = fullStatsContainer.createEl('div', { cls: 'statbar-stat-item' });
			fullReadTimeEl.createEl('span', { text: 'Estimated read time: ', cls: 'statbar-stat-label' });
			fullReadTimeEl.createEl('span', { text: `${fullReadTime} minutes`, cls: 'statbar-stat-value' });
		}

		// Close button
		const buttonContainer = contentEl.createEl('div', { cls: 'statbar-modal-buttons' });
		const closeButton = buttonContainer.createEl('button', { text: 'Close', cls: 'mod-cta' });
		closeButton.addEventListener('click', () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}