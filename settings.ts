import { App, PluginSettingTab, Setting } from "obsidian";
import WordCountPlugin from "./main"; // Adjust the import path if necessary

export class SampleSettingTab extends PluginSettingTab {
	plugin: WordCountPlugin;

	constructor(app: App, plugin: WordCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Section for Toggles
		containerEl.createEl("h2", { text: "Display Options" });

		new Setting(containerEl)
			.setName("Show Word Count")
			.setDesc("Toggle to display the word count in the status bar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showWordCount)
					.onChange(async (value) => {
						this.plugin.settings.showWordCount = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		new Setting(containerEl)
			.setName("Show Character Count")
			.setDesc("Toggle to display the character count in the status bar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showCharCount)
					.onChange(async (value) => {
						this.plugin.settings.showCharCount = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		// Section for Custom Labels
		containerEl.createEl("h2", { text: "Custom Labels" });

		new Setting(containerEl)
			.setName("Word Count Label")
			.setDesc("Customize the label for the word count.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.wordLabel)
					.onChange(async (value) => {
						this.plugin.settings.wordLabel = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		new Setting(containerEl)
			.setName("Character Count Label")
			.setDesc("Customize the label for the character count.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.charLabel)
					.onChange(async (value) => {
						this.plugin.settings.charLabel = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);
	}
}
