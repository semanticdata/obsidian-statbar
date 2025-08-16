import { App, Modal } from "obsidian";
import StatBarPlugin from "../main";
import { getEditorContext } from "./editor-context";
import { StatsService } from "./stats-service";

export class DetailedStatsModal extends Modal {
	plugin: StatBarPlugin;
	private statsService = new StatsService();

	constructor(app: App, plugin: StatBarPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Get current editor context
		const context = getEditorContext(this.app);
		if (!context.hasActiveView) {
			contentEl.createEl("p", { text: "No active markdown file" });
			return;
		}

		// Calculate stats for current context (selection or full document)
		const stats = this.statsService.calculateStats(
			context,
			this.plugin.settings,
		);

		// Current scope indicator (serves as main header)
		if (context.isSelection) {
			const scopeEl = contentEl.createEl("div", {
				cls: "statbar-modal-scope",
			});
			scopeEl.createEl("strong", { text: "📝 Selection Statistics" });
			scopeEl.createEl("p", {
				text: `Analyzing selected text (${context.selectedText.length} characters)`,
			});
		} else {
			const scopeEl = contentEl.createEl("div", {
				cls: "statbar-modal-scope",
			});
			scopeEl.createEl("strong", { text: "📄 Document Statistics" });
			scopeEl.createEl("p", { text: "Analyzing entire document" });
		}

		// Stats container
		const statsContainer = contentEl.createEl("div", {
			cls: "statbar-modal-stats",
		});

		// Word count
		const wordEl = statsContainer.createEl("div", {
			cls: "statbar-stat-item",
		});
		wordEl.createEl("span", { text: "Words: ", cls: "statbar-stat-label" });
		wordEl.createEl("span", {
			text: stats.wordCount.toLocaleString(),
			cls: "statbar-stat-value",
		});

		// Character count
		const charEl = statsContainer.createEl("div", {
			cls: "statbar-stat-item",
		});
		charEl.createEl("span", {
			text: "Characters: ",
			cls: "statbar-stat-label",
		});
		charEl.createEl("span", {
			text: stats.charCount.toLocaleString(),
			cls: "statbar-stat-value",
		});

		// Character count (no spaces)
		const charNoSpacesEl = statsContainer.createEl("div", {
			cls: "statbar-stat-item",
		});
		charNoSpacesEl.createEl("span", {
			text: "Characters (no spaces): ",
			cls: "statbar-stat-label",
		});
		charNoSpacesEl.createEl("span", {
			text: context.charNoSpaces.toLocaleString(),
			cls: "statbar-stat-value",
		});

		// Read time
		const readTimeEl = statsContainer.createEl("div", {
			cls: "statbar-stat-item",
		});
		readTimeEl.createEl("span", {
			text: "Estimated read time: ",
			cls: "statbar-stat-label",
		});
		readTimeEl.createEl("span", {
			text: `${stats.readTime} minutes`,
			cls: "statbar-stat-value",
		});

		// Reading speed info
		const speedEl = statsContainer.createEl("div", {
			cls: "statbar-stat-item statbar-stat-info",
		});
		speedEl.createEl("span", {
			text: `Based on ${this.plugin.settings.wordsPerMinute} words per minute`,
			cls: "statbar-stat-note",
		});

		// If there's a selection, also show document stats
		if (context.isSelection) {
			const fullStats = this.statsService.calculateFullDocumentStats(
				context.fullText,
				this.plugin.settings,
			);

			contentEl.createEl("hr");
			contentEl.createEl("h3", { text: "📄 Full Document Statistics" });

			const fullStatsContainer = contentEl.createEl("div", {
				cls: "statbar-modal-stats",
			});

			const fullWordEl = fullStatsContainer.createEl("div", {
				cls: "statbar-stat-item",
			});
			fullWordEl.createEl("span", {
				text: "Words: ",
				cls: "statbar-stat-label",
			});
			fullWordEl.createEl("span", {
				text: fullStats.wordCount.toLocaleString(),
				cls: "statbar-stat-value",
			});

			const fullCharEl = fullStatsContainer.createEl("div", {
				cls: "statbar-stat-item",
			});
			fullCharEl.createEl("span", {
				text: "Characters: ",
				cls: "statbar-stat-label",
			});
			fullCharEl.createEl("span", {
				text: fullStats.charCount.toLocaleString(),
				cls: "statbar-stat-value",
			});

			const fullReadTimeEl = fullStatsContainer.createEl("div", {
				cls: "statbar-stat-item",
			});
			fullReadTimeEl.createEl("span", {
				text: "Estimated read time: ",
				cls: "statbar-stat-label",
			});
			fullReadTimeEl.createEl("span", {
				text: `${fullStats.readTime} minutes`,
				cls: "statbar-stat-value",
			});
		}

		// Close button
		const buttonContainer = contentEl.createEl("div", {
			cls: "statbar-modal-buttons",
		});
		const closeButton = buttonContainer.createEl("button", {
			text: "Close",
			cls: "mod-cta",
		});
		closeButton.addEventListener("click", () => this.close());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
