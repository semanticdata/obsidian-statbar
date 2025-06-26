import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { StatBarSettingTab, MyPluginSettings, DEFAULT_SETTINGS } from "./src/settings";
import { debugLog } from "./src/debug";

interface DocumentStats {
	wordCount: number;
	charCount: number;
	readTime: string;
	isSelection?: boolean;
	selectionPrefix?: string;
}

export default class StatBarPlugin extends Plugin {
	settings!: MyPluginSettings; // Use definite assignment assertion
	statusBarItemEl!: HTMLElement; // Use definite assignment assertion
	lastSavedTimeEl!: HTMLElement; // New property for last saved time display

	// Performance optimization properties
	private debounceTimer: NodeJS.Timeout | null = null;
	private lastContentHash = "";
	private cachedStats: DocumentStats | null = null;
	private lastSelectionHash = "";
	private cachedSelectionStats: DocumentStats | null = null;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.settings = { ...DEFAULT_SETTINGS };
		this.statusBarItemEl = document.createElement("div"); // Initialize with a default HTMLElement
	}

	public async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItemEl = this.addStatusBarItem();

		// Initial update
		this.updateWordCount();

		// Register event handler for file changes
		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.updateWordCount();
			})
		);

		// Register event handler for active leaf changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				this.updateWordCount(); // Update word count on active leaf change
			})
		);

		// Register consolidated event handler for editor changes with debouncing
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.debouncedUpdate();
			})
		);

		// Register event listeners for selection changes
		this.registerDomEvent(document, 'selectionchange', () => {
			// Only update if we're in a markdown view
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				this.updateWordCount();
			}
		});

		// Also listen for mouse events that might change selection
		this.registerDomEvent(document, 'mouseup', () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				// Small delay to ensure selection has been updated
				setTimeout(() => this.updateWordCount(), 10);
			}
		});

		// Create last saved time display
		this.lastSavedTimeEl = this.addStatusBarItem();
		this.updateLastSavedTime(); // Initial update

		// Register event handler for file save events (proper save event listening)
		this.registerEvent(
			this.app.vault.on("modify", () => {
				this.updateLastSavedTime();
			})
		);

		// Add settings tab
		this.addSettingTab(new StatBarSettingTab(this.app, this));
	}

	public updateWordCount() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (activeView) {
			const editor = activeView.editor;

			// Check if there's an actual selection by comparing cursor positions
			const fromCursor = editor.getCursor('from');
			const toCursor = editor.getCursor('to');
			const hasSelection = fromCursor.line !== toCursor.line || fromCursor.ch !== toCursor.ch;

			const selectedText = hasSelection ? editor.getSelection() : '';
			const text = selectedText || activeView.getViewData(); // Use selected text if available
			const isSelection = hasSelection && selectedText.length > 0;

			// Check cache first (separate caching for selection vs document)
			const contentHash = this.getContentHash(text);
			const cachedStats = isSelection ?
				this.getCachedSelectionStats(contentHash) :
				this.getCachedStats(contentHash);

			let wordCount: number;
			let readTime: string;

			if (cachedStats) {
				wordCount = cachedStats.wordCount;
				readTime = cachedStats.readTime;
			} else {
				wordCount = this.getWordCount(text);
				readTime = this.calculateReadTime(wordCount);

				// Cache the results (separate caching for selection vs document)
				const stats: DocumentStats = {
					wordCount,
					charCount: text.length,
					readTime,
					isSelection
				};

				if (isSelection) {
					this.setCachedSelectionStats(contentHash, stats);
				} else {
					this.setCachedStats(contentHash, stats);
				}
			}

			const charCount = text.length;
			const charNoSpaces = text.replace(/\s/g, "").length;

			// Add selection prefix if text is selected and setting is enabled
			const selectionPrefix = (isSelection && this.settings.showSelectionStats) ?
				`${this.settings.selectionPrefix} ` : "";

			let statusText = "";
			if (this.settings.showWordCount) {
				statusText += `${selectionPrefix}${this.settings.wordLabel
					} ${wordCount.toLocaleString()}`;
			}
			if (this.settings.showCharCount) {
				if (statusText)
					statusText += ` ${this.settings.separatorLabel} `;
				statusText += `${this.settings.charLabel
					} ${charCount.toLocaleString()}`;
			}
			if (this.settings.showReadTime) {
				if (statusText)
					statusText += ` ${this.settings.separatorLabel} `;
				if (this.settings.readTimeLabelPosition === "before") {
					statusText += `${this.settings.readTimeLabel} ${readTime}`;
				} else {
					statusText += `${readTime} ${this.settings.readTimeLabel}`;
				}
			}

			this.statusBarItemEl.setText(statusText.trim());

			// Add tooltip with additional details only if something is being displayed
			if (statusText.trim()) {
				const tooltipPrefix = (isSelection && this.settings.showSelectionStats) ?
					"Selection Stats:\n" : "Document Stats:\n";
				const scopeInfo = (isSelection && this.settings.showSelectionStats) ?
					`Selected text (${selectedText.length} chars)\n` : "Full document\n";

				this.statusBarItemEl.setAttribute(
					"aria-label",
					tooltipPrefix +
					scopeInfo +
					`Words: ${wordCount.toLocaleString()}\n` +
					`Characters: ${charCount.toLocaleString()} (${charNoSpaces.toLocaleString()} no spaces)\n` +
					`Estimated Read Time: ${readTime} minutes`
				);
			} else {
				this.statusBarItemEl.setAttribute("aria-label", "");
			}
		} else {
			this.statusBarItemEl.setText("");
			this.statusBarItemEl.setAttribute("aria-label", "");
		}
	}

	private getWordCount(text: string): number {
		debugLog("Raw input text:", text);

		// Step-by-step cleaning for better accuracy
		let cleanText = text;

		// Remove code blocks first (multiline)
		cleanText = cleanText.replace(/```[\s\S]*?```/g, "");

		// Remove inline code
		cleanText = cleanText.replace(/`[^`]*`/g, "");

		// Process wiki links - extract content
		cleanText = cleanText.replace(/\[\[([^\]]+)\]\]/g, "$1");

		// Process markdown links - extract link text
		cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

		// Remove markdown syntax characters
		cleanText = cleanText.replace(/[#*_~>]/g, "");

		// Remove punctuation that might be attached to words
		cleanText = cleanText.replace(/[.,!?;:]/g, " ");

		// Normalize whitespace
		cleanText = cleanText.replace(/\s+/g, " ").trim();

		debugLog("After cleaning:", cleanText);

		// Final word count calculation
		if (!cleanText) return 0;
		const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
		debugLog("Words array:", words);
		debugLog("Word count:", words.length);

		return words.length;
	}

	private calculateReadTime(wordCount: number): string {
		const totalSeconds = Math.round(
			(wordCount / this.settings.wordsPerMinute) * 60
		);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${minutes}:${seconds.toString().padStart(2, "0")}`; // Format as "MM:SS"
	}

	public updateLastSavedTime() {
		if (this.settings.showLastSavedTime) {
			const now = new Date();
			const formattedTime = now.toLocaleTimeString(); // Format the time as needed
			this.lastSavedTimeEl.setText(`Last Saved: ${formattedTime}`);
		} else {
			this.lastSavedTimeEl.setText("");
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Performance optimization methods
	private debouncedUpdate() {
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => this.updateWordCount(), 300);
	}

	private getContentHash(text: string): string {
		return text.length + text.slice(0, 100) + text.slice(-100);
	}

	private getCachedStats(hash: string): DocumentStats | null {
		if (this.lastContentHash === hash && this.cachedStats) {
			return this.cachedStats;
		}
		return null;
	}

	private setCachedStats(hash: string, stats: DocumentStats): void {
		this.lastContentHash = hash;
		this.cachedStats = stats;
	}

	private getCachedSelectionStats(hash: string): DocumentStats | null {
		if (this.lastSelectionHash === hash && this.cachedSelectionStats) {
			return this.cachedSelectionStats;
		}
		return null;
	}

	private setCachedSelectionStats(hash: string, stats: DocumentStats): void {
		this.lastSelectionHash = hash;
		this.cachedSelectionStats = stats;
	}
}
