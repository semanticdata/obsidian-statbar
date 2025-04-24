import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { StatBarSettingTab, MyPluginSettings, DEFAULT_SETTINGS } from "./src/settings";
import { debugLog } from "./src/debug";

export default class StatBarPlugin extends Plugin {
	settings!: MyPluginSettings; // Use definite assignment assertion
	statusBarItemEl!: HTMLElement; // Use definite assignment assertion
	lastSavedTimeEl!: HTMLElement; // New property for last saved time display

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.settings = {
			showWordCount: true,
			showCharCount: true,
			wordLabel: "W:",
			charLabel: "Ch:",
			showReadTime: true,
			readTimeLabel: "Read Time:",
			readTimeLabelPosition: "after",
			separatorLabel: "|",
			wordsPerMinute: 200,
			showLastSavedTime: true,
		};
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

		// Register event handler for editor changes
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.updateWordCount();
			})
		);

		// Create last saved time display
		this.lastSavedTimeEl = this.addStatusBarItem();
		this.updateLastSavedTime(); // Initial update

		// Register event handler for editor changes
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.updateLastSavedTime(); // Update last saved time on editor change
			})
		);

		// Add settings tab
		this.addSettingTab(new StatBarSettingTab(this.app, this));
	}

	public updateWordCount() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (activeView) {
			const editor = activeView.editor;
			const selectedText = editor.getSelection();
			const text = selectedText || activeView.getViewData(); // Use selected text if available
			const wordCount = this.getWordCount(text);
			const charCount = text.length;
			const charNoSpaces = text.replace(/\s/g, "").length;

			// Calculate read time (200 words per minute)
			const readTime = this.calculateReadTime(wordCount);

			let statusText = "";
			if (this.settings.showWordCount) {
				statusText += `${this.settings.wordLabel
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

			// Add tooltip with additional details
			this.statusBarItemEl.setAttribute(
				"aria-label",
				`Words: ${wordCount.toLocaleString()} \n` +
				`Characters: ${charCount.toLocaleString()} (${charNoSpaces.toLocaleString()} no spaces) \n` +
				`Estimated Read Time: ${readTime} minutes`
			);
		} else {
			this.statusBarItemEl.setText("");
			this.statusBarItemEl.setAttribute("aria-label", "");
		}
	}

	private getWordCount(text: string): number {
		debugLog("Raw input text:", text);

		// Step 1: Remove wiki links
		let cleanText = text.replace(/\[\[([^\]]+)\]\]/g, "$1");
		debugLog("After removing wiki links:", cleanText);

		// Step 2: Remove Markdown links
		// cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); // Remove Markdown links // Failed ESLint
		cleanText = cleanText.replace(/\[([^\]]+)]\([^)]+\)/g, "$1"); // Remove Markdown links
		debugLog("After removing Markdown links:", cleanText);

		// Step 3: Remove code blocks first
		cleanText = cleanText.replace(/```[\s\S]*?```/g, ""); // Remove code blocks
		debugLog("After removing code blocks:", cleanText);

		// Step 4: Remove inline code
		cleanText = cleanText.replace(/`[^`]+`/g, ""); // Remove inline code
		debugLog("After removing inline code:", cleanText);

		// Step 5: Remove empty lines
		cleanText = cleanText.replace(/^\s*[\r\n]/gm, "");
		debugLog("After removing empty lines:", cleanText);

		// Step 6: Remove remaining Markdown syntax
		cleanText = cleanText.replace(/[#*`_~>]/g, "");
		debugLog("After removing remaining Markdown syntax:", cleanText);

		// Step 7: Normalize whitespace
		cleanText = cleanText.replace(/\s+/g, " ");
		debugLog("After normalizing whitespace:", cleanText);

		// Step 8: Trim leading and trailing whitespace
		cleanText = cleanText.trim();
		debugLog("After trimming whitespace:", cleanText);

		// Final word count calculation
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
}
