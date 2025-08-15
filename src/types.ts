export interface DocumentStats {
	wordCount: number;
	charCount: number;
	readTime: string;
	isSelection?: boolean;
	selectionPrefix?: string;
}