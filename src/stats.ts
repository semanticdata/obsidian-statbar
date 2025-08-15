import { debugLog } from "./debug";

export function getWordCount(text: string): number {
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

export function calculateReadTime(
	wordCount: number,
	wordsPerMinute: number,
): string {
	const totalSeconds = Math.round((wordCount / wordsPerMinute) * 60);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`; // Format as "MM:SS"
}
