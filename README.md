# 📚 FindMyBook

**A Brave browser extension that helps you find PDF versions of books using Google Search**

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

### Key Components

- **`manifest.json`**: Extension configuration and permissions
- **`index.html`**: Popup interface with modern styling
- **`scripts/popup.js`**: Frontend logic for user interaction
- **`scripts/background.js`**: Background service worker handling search logic

### Permissions Required

- **`activeTab`**: Access to the current active tab
- **`scripting`**: Execute scripts in web pages for link extraction
- **`tabs`**: Create and manage hidden tabs for searching
- **`<all_urls>`**: Access Google search pages for PDF extraction

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

### Key Functions

**Background Script (`background.js`):**
- `startPdfSearch()`: Initiates the PDF search process
- `performSearch()`: Iterates through Google search result pages
- `checkForCaptcha()`: Detects captcha challenges
- `extractLinksFromTab()`: Extracts PDF links from search results
- `checkIfPageEmpty()`: Determines when search results are exhausted

**Popup Script (`popup.js`):**
- `showLoading()`: Displays search progress
- `showResults()`: Displays found PDF links
- `showCaptchaMessage()`: Shows captcha resolution instructions
- `updateProgress()`: Updates real-time search progress

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

## 🔒 Privacy & Security

- **No Data Collection**: The extension doesn't collect or store personal data
- **Local Processing**: All searches happen locally in your browser
- **Temporary Storage**: Search results are only stored temporarily during the session
- **HTTPS Only**: Only secure PDF links are returned

## 🐛 Troubleshooting

### Extension Won't Start
- Ensure you're using Brave browser
- Check that developer mode is enabled
- Verify all extension files are present

### No PDFs Found
- Try searching from a more specific page (book title, author)
- The page content may not contain book-related terms
- Google may not have indexed relevant PDFs

### Frequent Captchas
- This is Google's anti-bot protection
- Try waiting longer between searches
- Clear your browser data and restart Brave

### Search Gets Stuck
- Close and reopen the extension popup
- Check if the hidden search tab is still active
- Restart the browser if issues persist

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with various websites
5. Submit a pull request

## 📄 License

This project is open source. Please ensure you comply with Google's Terms of Service and respect copyright laws when using this extension.

## 🔄 Version History

- **v0.0.1**: Initial release with basic PDF search functionality

## ⚖️ Legal Notice

This extension is for educational and research purposes. Users are responsible for ensuring their use complies with applicable copyright laws and website terms of service. The developers are not responsible for any misuse of this tool.

---

**Made with ❤️ for book lovers and researchers**
