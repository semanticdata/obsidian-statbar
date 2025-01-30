import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { StatBarSettingTab } from "./settings";

interface MyPluginSettings {
	showWordCount: boolean;
	showCharCount: boolean;
	wordLabel: string;
	charLabel: string;
	showReadTime: boolean;
	readTimeLabel: string;
	readTimeLabelPosition: "before" | "after";
	separatorLabel: string;
	wordsPerMinute: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	showWordCount: true,
	showCharCount: true,
	showReadTime: true,
	wordLabel: "W:",
	charLabel: "Ch:",
	readTimeLabel: "min read",
	readTimeLabelPosition: "after",
	separatorLabel: "|",
	wordsPerMinute: 200,
};

export default class StatBarPlugin extends Plugin {
	settings!: MyPluginSettings; // Use definite assignment assertion
	statusBarItemEl!: HTMLElement; // Use definite assignment assertion

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
				statusText += `${
					this.settings.wordLabel
				} ${wordCount.toLocaleString()}`;
			}
			if (this.settings.showCharCount) {
				if (statusText)
					statusText += ` ${this.settings.separatorLabel} `;
				statusText += `${
					this.settings.charLabel
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
		// Log the raw input text before cleaning
		// console.log("Raw input text:", text); // Debugging line

		// Step 1: Remove wiki links
		let cleanText = text.replace(/\[\[([^\]]+)\]\]/g, "$1");
		// console.log("After removing wiki links:", cleanText); // Debugging line

		// Step 2: Remove Markdown links
		// cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); // Remove Markdown links // Failed ESLint
		cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Remove Markdown links
		// console.log("After removing Markdown links:", cleanText); // Debugging line

		// Step 3: Remove code blocks first
		cleanText = cleanText.replace(/```[\s\S]*?```/g, ""); // Remove code blocks
		// console.log("After removing code blocks:", cleanText); // Debugging line

		// Step 4: Remove inline code
		cleanText = cleanText.replace(/`[^`]+`/g, ""); // Remove inline code
		// console.log("After removing inline code:", cleanText); // Debugging line

		// Step 5: Remove empty lines
		cleanText = cleanText.replace(/^\s*[\r\n]/gm, "");
		// console.log("After removing empty lines:", cleanText); // Debugging line

		// Step 6: Remove remaining Markdown syntax
		cleanText = cleanText.replace(/[#*`_~>]/g, "");
		// console.log("After removing remaining Markdown syntax:", cleanText); // Debugging line

		// Step 7: Normalize whitespace
		cleanText = cleanText.replace(/\s+/g, " ");
		// console.log("After normalizing whitespace:", cleanText); // Debugging line

		// Step 8: Trim leading and trailing whitespace
		cleanText = cleanText.trim();
		// console.log("After trimming whitespace:", cleanText); // Debugging line

		// Final word count calculation
		const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
		// console.log("Words array:", words); // Debugging line
		// console.log("Word count:", words.length); // Debugging line

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
