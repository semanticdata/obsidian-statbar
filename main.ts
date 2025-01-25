import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { SampleSettingTab } from "./settings";

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

		// Register event handler for editor changes
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.updateWordCount();
			})
		);

		// Add settings tab
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
				} ${wordCount.toLocaleString()} ${
					this.settings.separatorLabel
				} `;
			}
			if (this.settings.showCharCount) {
				statusText += `${
					this.settings.charLabel
				} ${charCount.toLocaleString()} ${
					this.settings.separatorLabel
				} `;
			}
			if (this.settings.showReadTime) {
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
				`Words: ${wordCount.toLocaleString()} ` +
					`Characters: ${charCount.toLocaleString()} (${charNoSpaces.toLocaleString()} no spaces) ` +
					`Estimated Read Time: ${readTime}`
			);
		} else {
			this.statusBarItemEl.setText("");
			this.statusBarItemEl.setAttribute("aria-label", "");
		}
	}

	private getWordCount(text: string): number {
		// Remove markdown syntax, URLs, and other special patterns
		const cleanText = text
			.replace(/\[\[([^\]]+)\]\]/g, "$1") // Remove wiki links but keep text
			.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove MD links but keep text
			.replace(/`[^`]+`/g, "") // Remove inline code
			.replace(/```[\s\S]*?```/g, "") // Remove code blocks
			.replace(/[#*`_~>]/g, " ") // Remove remaining MD syntax
			.replace(/\s+/g, " ") // Normalize whitespace
			.trim();

		const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
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
