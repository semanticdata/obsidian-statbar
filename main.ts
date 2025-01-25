import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { SampleSettingTab } from "./settings"; // Import the new settings class

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	showWordCount: boolean;
	showCharCount: boolean;
	wordLabel: string; // Label for word count
	charLabel: string; // Label for character count
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	showWordCount: true,
	showCharCount: true,
	wordLabel: "W:", // Default label for word count
	charLabel: "Ch:", // Default label for character count
};

export default class WordCountPlugin extends Plugin {
	settings!: MyPluginSettings; // Use definite assignment assertion
	statusBarItemEl!: HTMLElement; // Use definite assignment assertion

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.settings = {
			showWordCount: true,
			showCharCount: true,
			wordLabel: "W:",
			charLabel: "Ch:",
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
			const text = activeView.getViewData();
			const wordCount = this.getWordCount(text);
			const charCount = text.length;
			const charNoSpaces = text.replace(/\s/g, "").length;

			let statusText = "";
			if (this.settings.showWordCount) {
				statusText += `${
					this.settings.wordLabel
				} ${wordCount.toLocaleString()} `;
			}
			if (this.settings.showCharCount) {
				statusText += `${
					this.settings.charLabel
				} ${charCount.toLocaleString()}`;
			}

			this.statusBarItemEl.setText(statusText.trim());

			// Add tooltip with additional details
			this.statusBarItemEl.setAttribute(
				"aria-label",
				`Words: ${wordCount.toLocaleString()} ` +
					`Characters: ${charCount.toLocaleString()} (${charNoSpaces.toLocaleString()} no spaces)`
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
