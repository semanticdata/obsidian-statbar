import { App, PluginSettingTab, Setting } from "obsidian";
import StatBarPlugin from "./main"; // Adjust the import path if necessary

export class StatBarSettingTab extends PluginSettingTab {
	plugin: StatBarPlugin;

	constructor(app: App, plugin: StatBarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Section for Toggles
		// containerEl.createEl("h2", { text: "Display Options" });

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

		new Setting(containerEl)
			.setName("Show Read Time")
			.setDesc(
				"Toggle to display the estimated read time in the status bar."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showReadTime)
					.onChange(async (value) => {
						this.plugin.settings.showReadTime = value;
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

		new Setting(containerEl)
			.setName("Read Time Label")
			.setDesc("Customize the label for the read time.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.readTimeLabel)
					.onChange(async (value) => {
						this.plugin.settings.readTimeLabel = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		new Setting(containerEl)
			.setName("Separator Label")
			.setDesc(
				"Customize the label used as a separator between components."
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.separatorLabel)
					.onChange(async (value) => {
						this.plugin.settings.separatorLabel = value;
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		new Setting(containerEl)
			.setName("Read Time Label Position")
			.setDesc(
				"Choose whether the read time label appears before or after the time."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption("before", "Before")
					.addOption("after", "After")
					.setValue(this.plugin.settings.readTimeLabelPosition)
					.onChange(async (value) => {
						this.plugin.settings.readTimeLabelPosition = value as
							| "before"
							| "after";
						await this.plugin.saveSettings();
						this.plugin.updateWordCount(); // Update display immediately
					})
			);

		// New setting for custom words per minute
		new Setting(containerEl)
			.setName("Words Per Minute")
			.setDesc("Customize the average reading speed in words per minute.")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.wordsPerMinute.toString())
					.onChange(async (value) => {
						const wpm = parseInt(value);
						if (!isNaN(wpm) && wpm > 0) {
							this.plugin.settings.wordsPerMinute = wpm;
							await this.plugin.saveSettings();
							this.plugin.updateWordCount(); // Update display immediately
						}
					})
			);
	}
}
