import { EditorContext } from "./editor-context";
import { DocumentStats } from "./types";
import { MyPluginSettings } from "./settings";
import { getWordCount, calculateReadTime } from "./stats";

export class StatsService {
	private lastContentHash = "";
	private cachedStats: DocumentStats | null = null;
	private lastSelectionHash = "";
	private cachedSelectionStats: DocumentStats | null = null;

	calculateStats(context: EditorContext, settings: MyPluginSettings): DocumentStats {
		if (!context.hasActiveView) {
			return {
				wordCount: 0,
				charCount: 0,
				readTime: "0:00",
				isSelection: false,
			};
		}

		// Check cache first (separate caching for selection vs document)
		const contentHash = this.getContentHash(context.currentText);
		const cachedStats = context.isSelection
			? this.getCachedSelectionStats(contentHash)
			: this.getCachedStats(contentHash);

		if (cachedStats) {
			return cachedStats;
		}

		// Calculate new stats
		const wordCount = getWordCount(context.currentText);
		const readTime = calculateReadTime(wordCount, settings.wordsPerMinute);

		const stats: DocumentStats = {
			wordCount,
			charCount: context.charCount,
			readTime,
			isSelection: context.isSelection,
		};

		// Cache the results (separate caching for selection vs document)
		if (context.isSelection) {
			this.setCachedSelectionStats(contentHash, stats);
		} else {
			this.setCachedStats(contentHash, stats);
		}

		return stats;
	}

	calculateFullDocumentStats(fullText: string, settings: MyPluginSettings): DocumentStats {
		const wordCount = getWordCount(fullText);
		const readTime = calculateReadTime(wordCount, settings.wordsPerMinute);

		return {
			wordCount,
			charCount: fullText.length,
			readTime,
			isSelection: false,
		};
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