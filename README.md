# CSSer Chrome Extension

A Chrome extension that allows you to inject custom CSS into any webpage. The CSS is saved per domain and automatically applied as you type.

## Features

- Real-time CSS injection
- Per-domain CSS storage
- Syntax highlighting
- Auto-indentation
- Line numbers
- Dark theme (Monokai)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/seriusokhatsky/csser.git
cd csser
```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the `csser` directory

## Usage

1. Click the CSSer icon in your Chrome toolbar
2. Enter your CSS in the editor
3. The CSS will be automatically applied to the current webpage
4. Your CSS is saved per domain and will be loaded automatically when you return to the same website

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Extension functionality
- `lib/codemirror6/` - CodeMirror editor files
- `icon48.png` and `icon128.png` - Extension icons

## Development

The extension uses:
- CodeMirror 6 for the CSS editor
- Chrome Extension Manifest V3
- Chrome Storage API for saving CSS
- Chrome Scripting API for injecting CSS

## License

MIT License 