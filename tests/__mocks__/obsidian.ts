// Mock implementation of Obsidian API for testing

export class App {
  vault = {
    on: jest.fn(),
    off: jest.fn(),
    modify: jest.fn()
  };
  workspace = {
    on: jest.fn(),
    off: jest.fn(),
    getActiveFile: jest.fn(),
    getActiveViewOfType: jest.fn()
  };
}

export class Plugin {
  app: App;
  manifest: PluginManifest;

  constructor(app: App, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;

    // Ensure app is properly bound
    if (!this.app) {
      throw new Error('App is required for Plugin constructor');
    }
  }

  addStatusBarItem() {
    return {
      setText: jest.fn(),
      setTitle: jest.fn(),
      setAttribute: jest.fn(),
      remove: jest.fn()
    };
  }

  addSettingTab() { }

  registerEvent(eventRef: any) {
    return eventRef;
  }

  registerDomEvent(el: any, type: string, callback: any) {
    return { el, type, callback };
  }

  async loadData() {
    return {};
  }

  async saveData(data: any) {
    return undefined;
  }

  async onload() { }

  onunload() { }
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }

  display = jest.fn();
  hide = jest.fn();
}

export class Setting {
  settingEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
  }

  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addSlider = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addButton = jest.fn().mockReturnThis();
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  author: string;
}

export interface TFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
}

export interface Editor {
  getValue(): string;
  getSelection(): string;
  getCursor(string?: 'from' | 'to' | 'head' | 'anchor'): { line: number; ch: number };
  getLine(line: number): string;
}

export interface MarkdownView {
  editor: Editor;
  file: TFile;
  getViewData(): string;
}

// Mock some commonly used functions
export const normalizePath = jest.fn((path: string) => path);
export const Notice = jest.fn();