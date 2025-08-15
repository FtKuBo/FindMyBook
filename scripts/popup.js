async function getCurrentTab() {
    try {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        return tab;
    } catch (error) {
        console.error('Error getting current tab:', error);
        throw error;
    }
}

const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const pdfList = document.getElementById('pdfList');
const pdfCount = document.getElementById('pdfCount');

function showLoading() {
  searchBtn.style.display = 'none';
  loading.style.display = 'block';
  results.style.display = 'none';
}

function showResults(urls) {
  loading.style.display = 'none';
  results.style.display = 'block';
  
  // Clear previous results
  pdfList.innerHTML = '';
  
  if (urls.length === 0) {
    pdfList.innerHTML = '<div class="no-results">No PDF files found on this page</div>';
    pdfCount.textContent = '';
  } else {
    pdfCount.textContent = `Found ${urls.length} PDF file${urls.length === 1 ? '' : 's'}`;
    
    urls.forEach(url => {
      const item = document.createElement('div');
      item.className = 'pdf-item';
      item.textContent = url;
      item.title = 'Click to copy URL';
      item.addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => {
          item.textContent = 'Copied!';
          setTimeout(() => {
            item.textContent = url;
          }, 1000);
        });
      });
      pdfList.appendChild(item);
    });
  }
  
  searchBtn.style.display = 'inline-block';
  searchBtn.textContent = '🔍 Search Again';
}

function showError(message) {
  loading.style.display = 'none';
  results.style.display = 'block';
  pdfList.innerHTML = `<div class="no-results">Error: ${message}</div>`;
  pdfCount.textContent = '';
  searchBtn.style.display = 'inline-block';
  searchBtn.textContent = '🔍 Try Again';
}

function updateProgress(currentPage, totalPages, pdfCount) {
  const loadingText = document.querySelector('.loading-text');
  if (loadingText) {
    const totalPagesText = totalPages === '?' ? '?' : totalPages;
    loadingText.innerHTML = `
      Searching page ${currentPage}${totalPagesText === '?' ? '...' : ` of ${totalPages}...`}<br>
      Found ${pdfCount} PDF files so far<br>
      <strong>Please don't close this popup</strong>
    `;
  }
}

function showCaptchaMessage(message, captchaInfo) {
  loading.style.display = 'none';
  results.style.display = 'block';
  
  const captchaTitle = captchaInfo && captchaInfo.title ? captchaInfo.title : 'Captcha detected';
  
  pdfList.innerHTML = `
    <div class="captcha-message">
      <div class="captcha-icon">🤖</div>
      <h3>Captcha Detected</h3>
      <p><strong>Detected on:</strong> ${captchaTitle}</p>
      <p>${message}</p>
      <div class="captcha-instructions">
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Go back to the original page (tab you were searching)</li>
          <li>Reload that page (press F5 or Ctrl+R / Cmd+R)</li>
          <li>Solve any captchas that appear</li>
          <li>Come back here and click "Start New Search"</li>
        </ol>
      </div>
    </div>
  `;
  
  pdfCount.textContent = '';
  searchBtn.style.display = 'inline-block';
  searchBtn.textContent = '🔍 Start New Search';
}

searchBtn.addEventListener('click', async () => {
  try {
    const tab = await getCurrentTab();
    
    const response = await chrome.runtime.sendMessage({
      action: 'startSearch',
      tabId: tab.id
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to start search');
    }
    
  } catch (error) {
    showError('Failed to start search: ' + error.message);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const status = await chrome.runtime.sendMessage({ action: 'getSearchStatus' });
    
    if (status.searchComplete) {
      // Search already completed - show results or error
      if (status.lastError) {
        showError(status.lastError);
      } else if (status.lastResults && status.lastResults.length > 0) {
        showResults(status.lastResults);
      }
    } else if (status.isRunning) {
      // Search is actively running - show progress
      showLoading();
      updateProgress(status.currentPage, '?', status.pdfCount);
      searchBtn.textContent = '⏳ Searching...';
    }
    // If neither running nor complete, show initial state (search button)
  } catch (error) {
    console.error('Error in DOMContentLoaded:', error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'searchStarted':
      showLoading();
      break;
      
    case 'searchProgress':
      updateProgress(message.currentPage, message.totalPages, message.pdfCount);
      break;
      
    case 'searchComplete':
      showResults(message.results);
      break;
      
    case 'searchError':
      showError(message.error);
      break;
      
    case 'searchCancelled':
      showError('Search was cancelled');
      break;
      
    case 'searchInterrupted':
      showError('Search was interrupted: ' + message.error);
      break;
      
    case 'captchaDetected':
      showCaptchaMessage(message.message, message.captchaInfo);
      break;
  }
});
