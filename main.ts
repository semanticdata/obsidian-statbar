import { App, MarkdownView, Plugin, PluginManifest } from "obsidian";
import { StatBarSettingTab, DEFAULT_SETTINGS } from "./src/settings";
import { getEditorContext } from "./src/editor-context";
import { StatsService } from "./src/stats-service";
import { DocumentStats, EditorContext, MyPluginSettings } from "./src/types";
import { DetailedStatsModal } from "./src/modal";

export default class StatBarPlugin extends Plugin {
	settings!: MyPluginSettings; // Use definite assignment assertion
	statusBarItemEl!: HTMLElement; // Use definite assignment assertion
	lastSavedTimeEl!: HTMLElement; // New property for last saved time display

	// Performance optimization properties
	private debounceTimer: NodeJS.Timeout | null = null;
	private statsService = new StatsService();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.settings = { ...DEFAULT_SETTINGS };
		this.statusBarItemEl = document.createElement("div"); // Initialize with a default HTMLElement
	}

	public async onload() {
		await this.loadSettings();

		// Create status bar item
		this.statusBarItemEl = this.addStatusBarItem();
		this.statusBarItemEl.addClass("statbar-stats");

		// Make status bar clickable
		this.statusBarItemEl.addEventListener("click", () => {
			this.showDetailedStatsModal();
		});
		this.statusBarItemEl.style.cursor = "pointer";

		// Initial update
		this.updateWordCount();

		// Register event handler for file changes
		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				this.updateWordCount();
			}),
		);

		// Register event handler for active leaf changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				this.updateWordCount(); // Update word count on active leaf change
			}),
		);

		// Register consolidated event handler for editor changes with debouncing
		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				this.debouncedUpdate();
			}),
		);

		// Register event listeners for selection changes
		this.registerDomEvent(document, "selectionchange", () => {
			// Only update if we're in a markdown view
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				this.updateWordCount();
			}
		});

		// Also listen for mouse events that might change selection
		this.registerDomEvent(document, "mouseup", () => {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				// Small delay to ensure selection has been updated
				setTimeout(() => this.updateWordCount(), 10);
			}
		});

		// Create last saved time display
		this.lastSavedTimeEl = this.addStatusBarItem();
		this.lastSavedTimeEl.addClass("statbar-time");
		this.updateLastSavedTime(); // Initial update

		// Register event handler for file save events (proper save event listening)
		this.registerEvent(
			this.app.vault.on("modify", () => {
				this.updateLastSavedTime();
			}),
		);

		// Add settings tab
		this.addSettingTab(new StatBarSettingTab(this.app, this));
	}

	private clearStatusBar(): void {
		this.statusBarItemEl.setText("");
		this.statusBarItemEl.setAttribute("aria-label", "");
	}

	private buildStatusText(
		context: EditorContext,
		stats: DocumentStats,
	): string {
		// Add selection prefix if text is selected and setting is enabled
		const selectionPrefix =
			context.isSelection && this.settings.showSelectionStats
				? `${this.settings.selectionPrefix} `
				: "";

		let statusText = "";

		if (this.settings.showWordCount) {
			statusText += `${selectionPrefix}${
				this.settings.wordLabel
			} ${stats.wordCount.toLocaleString()}`;
		}

		if (this.settings.showCharCount) {
			if (statusText) statusText += ` ${this.settings.separatorLabel} `;
			statusText += `${
				this.settings.charLabel
			} ${stats.charCount.toLocaleString()}`;
		}

		if (this.settings.showReadTime) {
			if (statusText) statusText += ` ${this.settings.separatorLabel} `;
			if (this.settings.readTimeLabelPosition === "before") {
				statusText += `${this.settings.readTimeLabel} ${stats.readTime}`;
			} else {
				statusText += `${stats.readTime} ${this.settings.readTimeLabel}`;
			}
		}

		if (this.settings.showCursorLocation) {
			if (statusText) statusText += ` ${this.settings.separatorLabel} `;
			const cursorText = this.settings.cursorLocationFormat
				.replace("{line}", context.cursorLine.toString())
				.replace("{char}", context.cursorCharacter.toString());
			statusText += `${this.settings.cursorLocationLabel} ${cursorText}`;
		}

		return statusText.trim();
	}

	private buildTooltip(context: EditorContext, stats: DocumentStats): string {
		const tooltipPrefix =
			context.isSelection && this.settings.showSelectionStats
				? "Selection Stats:\n"
				: "Document Stats:\n";
		const scopeInfo =
			context.isSelection && this.settings.showSelectionStats
				? `Selected text (${context.selectedText.length} chars)\n`
				: "Full document\n";

		const cursorInfo = this.settings.showCursorLocation 
			? `\nCursor: Line ${context.cursorLine}, Column ${context.cursorCharacter}`
			: "";

		return (
			tooltipPrefix +
			scopeInfo +
			`Words: ${stats.wordCount.toLocaleString()}\n` +
			`Characters: ${stats.charCount.toLocaleString()} (${context.charNoSpaces.toLocaleString()} no spaces)\n` +
			`Estimated Read Time: ${stats.readTime} minutes` +
			cursorInfo
		);
	}

	private updateStatusBarDisplay(statusText: string, tooltip: string): void {
		this.statusBarItemEl.setText(statusText);

		if (statusText) {
			this.statusBarItemEl.setAttribute("aria-label", tooltip);
		} else {
			this.statusBarItemEl.setAttribute("aria-label", "");
		}
	}

	public updateWordCount() {
		const context = getEditorContext(this.app);

		if (!context.hasActiveView) {
			this.clearStatusBar();
			return;
		}

		const stats = this.statsService.calculateStats(context, this.settings);
		const statusText = this.buildStatusText(context, stats);
		const tooltip = statusText ? this.buildTooltip(context, stats) : "";

		this.updateStatusBarDisplay(statusText, tooltip);
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
			await this.loadData(),
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

	private showDetailedStatsModal(): void {
		new DetailedStatsModal(this.app, this).open();
	}
}
