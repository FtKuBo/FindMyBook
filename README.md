# 📚 FindMyBook

**A Brave browser extension that helps you find PDF versions of books using Google Search**

## 🎥 Video Demo

https://github.com/user-attachments/assets/eda20c92-cb25-471f-8258-2010c6e03272



## 🎯 What does it do?

FindMyBook is a browser extension designed to help you quickly find PDF versions of books. When you're on a page (like a book listing, author page, or search results), simply click the extension button and it will search Google for PDF versions of relevant books, presenting you with a clean list of downloadable PDFs.

## ✨ Features

- **One-Click PDF Search**: Simply click "Search for PDFs" to automatically search Google for PDF versions
- **Smart Link Extraction**: Automatically finds and filters PDF links from Google search results  
- **Captcha Detection**: Intelligently detects when Google shows captchas and guides you through resolving them
- **Progress Tracking**: Shows real-time progress as it searches through multiple pages of results
- **Click-to-Copy URLs**: Click any PDF link to copy it to your clipboard
- **Clean, Modern UI**: Beautiful gradient interface with intuitive design
- **Background Processing**: Searches happen in hidden tabs so you can continue browsing

## 🚀 How to Use

1. **Install the extension** in your Brave browser
2. **Navigate to any webpage** (book listings, search results, etc.)
3. **Click the FindMyBook extension icon** in your toolbar
4. **Click "Search for PDFs"** in the popup
5. **Wait for results** - the extension will search through Google results automatically
6. **Click any PDF link** to copy it to your clipboard
7. **Open the PDF** by pasting the URL in a new tab

### 🤖 Handling Captchas

If Google shows a captcha during the search:

1. The extension will detect it automatically
2. Follow the on-screen instructions:
   - Go back to your original tab
   - Reload the page (F5 or Ctrl+R / Cmd+R)
   - Solve any captchas that appear
   - Return to the extension and click "Start New Search"

## 🛠️ Technical Details

### Architecture

- **Manifest V3** Chrome extension
- **Background Service Worker** for persistent search state management
- **Content Scripts** for dynamic page interaction
- **Hidden Tab Processing** for non-intrusive searching

## 🏗️ Installation

### For Users

1. Download the extension files
2. Open Brave browser
3. Go to `brave://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the FindMyBook folder
7. The extension icon should appear in your toolbar

### For Developers

```bash
git clone <repository-url>
cd findMyBook
# Load the extension in Brave using the steps above
```

## 🔧 Development

### Project Structure

```
findMyBook/
├── manifest.json          # Extension configuration
├── index.html            # Popup interface
├── icons/
│   └── icon.png         # Extension icon
├── scripts/
│   ├── popup.js         # Popup logic and UI handling
│   └── background.js    # Background service worker
└── README.md           # This file
```

### Search Algorithm

1. Takes current page URL and appends Google search parameters
2. Creates hidden tab to perform searches
3. Iterates through search result pages (offset-based pagination)
4. Extracts all links from each page
5. Filters for valid HTTPS PDF URLs
6. Detects captchas and empty result pages
7. Returns deduplicated list of PDF URLs

## ⚠️ Limitations

- **Brave Browser Only**: Currently designed and tested specifically for Brave
- **Google Search Dependency**: Relies on Google search results and structure
- **Captcha Interruptions**: Google's anti-bot measures may require manual intervention
- **Rate Limiting**: Searches are throttled to avoid triggering anti-bot measures
