// Background script - Persistent state management for PDF search

chrome.runtime.onInstalled.addListener(() => {
    // Extension installed/updated
});

let searchState = {
    isRunning: false,
    hiddenTabId: null,
    pdfUrls: new Set(),
    originalTabId: null,
    currentSearchCount: 0,
    lastResults: [],
    lastError: null,
    searchComplete: false
};

function urlToPdfUrl(url) {
    return url + "&offset=0";
}

function isValidUrl(url) {
    try {
        let newUrl = new URL(url);
        return newUrl.protocol === 'https:';
    } catch(e) {
        return false;
    }
}

function isPdfUrl(url) {
    return url.indexOf(".pdf") !== -1;
}

async function createHiddenTab(url) {
    try {
        let hiddenTab = await chrome.tabs.create({
            url: url, 
            active: false,
            windowId: chrome.windows.WINDOW_ID_CURRENT
        });
        
        if (!hiddenTab || !hiddenTab.id) {
            throw new Error('Failed to create hidden tab');
        }
        
        return hiddenTab;
    } catch (error) {
        throw error;
    }
}

async function updateHiddenTab(url, tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab) {
            throw new Error(`Tab with ID ${tabId} not found`);
        }
        
        const updatedTab = await chrome.tabs.update(tabId, { url: url });
        return updatedTab;
    } catch (error) {
        throw error;
    }
}

async function deleteHiddenTab(tabId) {
    try {
        if (!tabId) return;
        
        const tab = await chrome.tabs.get(tabId);
        if (!tab) {
            return; // Already closed
        }
        
        await chrome.tabs.remove(tabId);
    } catch (error) {
    }
}

async function checkForCaptcha(tabId) {
    try {
        // Get tab title
        const tab = await chrome.tabs.get(tabId);
        const title = tab.title ? tab.title.toLowerCase() : '';
        
        // Check title for captcha indicators (including Brave's PoW captcha)
        const titleIndicators = ['captcha', 'robot', 'verification', 'challenge', 'security check', 'prove you are human', 'pow captcha'];
        const hasCaptchaTitle = titleIndicators.some(indicator => title.includes(indicator));
        
        if (hasCaptchaTitle) {
            return { hasCaptcha: true, source: 'title', title: tab.title };
        }
        
        // Check page content for captcha elements
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                try {
                    // Common captcha indicators in page content
                    const captchaSelectors = [
                        '[class*="captcha" i]',
                        '[id*="captcha" i]',
                        '[class*="recaptcha" i]',
                        '[id*="recaptcha" i]',
                        'iframe[src*="recaptcha"]',
                        'iframe[src*="captcha"]',
                        '[class*="challenge" i]',
                        '[class*="verification" i]',
                        '[class*="robot" i]'
                    ];
                    
                    for (const selector of captchaSelectors) {
                        if (document.querySelector(selector)) {
                            return { hasCaptcha: true, selector };
                        }
                    }
                    
                    // Check for common captcha text content
                    const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
                    const textIndicators = [
                        'prove you are human',
                        'security verification',
                        'robot verification',
                        'please complete the captcha',
                        'verify you are not a robot',
                        'solve the puzzle',
                        'complete the challenge',
                        'confirm you\'re a human being',
                        'i\'m not a robot',
                        'proof of work captcha',
                        'switch to traditional captcha'
                    ];
                    
                    for (const indicator of textIndicators) {
                        if (bodyText.includes(indicator)) {
                            return { hasCaptcha: true, textMatch: indicator };
                        }
                    }
                    
                    return { hasCaptcha: false };
                } catch (error) {
                    return { hasCaptcha: false, error: error.message };
                }
            }
        });
        
        if (results && results[0] && results[0].result) {
            const contentResult = results[0].result;
            if (contentResult.hasCaptcha) {
                return { 
                    hasCaptcha: true, 
                    source: 'content', 
                    title: tab.title,
                    details: contentResult
                };
            }
        }
        
        return { hasCaptcha: false, title: tab.title };
    } catch (error) {
        return { hasCaptcha: false, error: error.message };
    }
}

async function checkIfPageEmpty(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                try {
                    const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
                    
                    // Check for "no results" indicators
                    const noResultsIndicators = [
                        'not many great matches came back',
                        'no results found',
                        'no matches found',
                        'try different keywords',
                        'try more general keywords',
                        'try fewer keywords',
                        'no search results',
                        'didn\'t match any documents',
                        'your search did not match',
                        'no results',
                        'nothing found'
                    ];
                    
                    // Check if any no-results indicator is present
                    const hasNoResultsText = noResultsIndicators.some(indicator => 
                        bodyText.includes(indicator)
                    );
                    
                    // Also check if there are very few or no search result links
                    // Look for typical search result patterns
                    const searchResults = document.querySelectorAll('a[href*="http"]');
                    const resultCount = searchResults.length;
                    
                    // Check for "Find elsewhere" section which appears when no results
                    const hasFindElsewhere = bodyText.includes('find elsewhere');
                    
                    // Check for "Related queries" which often appears with no results
                    const hasRelatedQueries = bodyText.includes('related queries');
                    
                    return {
                        isEmpty: hasNoResultsText || (resultCount < 5 && (hasFindElsewhere || hasRelatedQueries)),
                        indicators: {
                            hasNoResultsText,
                            resultCount,
                            hasFindElsewhere,
                            hasRelatedQueries
                        },
                        bodyTextSample: bodyText.substring(0, 200)
                    };
                } catch (error) {
                    return { isEmpty: false, error: error.message };
                }
            }
        });
        
        if (results && results[0] && results[0].result) {
            return results[0].result;
        }
        return { isEmpty: false };
    } catch (error) {
        return { isEmpty: false, error: error.message };
    }
}

async function extractLinksFromTab(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                try {
                    const links = Array.from(document.querySelectorAll("a"))
                        .map(link => link.href)
                        .filter(href => href && href.trim() !== '');
                    return links;
                } catch (error) {
                    return [];
                }
            }
        });
        
        if (results && results[0] && results[0].result) {
            return results[0].result;
        }
        return [];
    } catch (error) {
        return [];
    }
}

async function startPdfSearch(originalTabId) {
    if (searchState.isRunning) {
        return { success: false, error: 'Search already in progress' };
    }
    
    try {
        searchState.isRunning = true;
        searchState.pdfUrls = new Set();
        searchState.originalTabId = originalTabId;
        searchState.currentSearchCount = 0;
        
        // Reset completion state for new search
        searchState.searchComplete = false;
        searchState.lastResults = [];
        searchState.lastError = null;
        
        const originalTab = await chrome.tabs.get(originalTabId);
        const origUrl = originalTab.url;
        const currUrl = urlToPdfUrl(origUrl);
        
        const hiddenTab = await createHiddenTab(currUrl);
        searchState.hiddenTabId = hiddenTab.id;
        try {
            await chrome.runtime.sendMessage({
                type: 'searchStarted',
                tabId: originalTabId
            });
        } catch (e) {
        }
        
        await performSearch(origUrl);
        
        const results = Array.from(searchState.pdfUrls);
        
        // Send completion message BEFORE cleanup (just like searchProgress works)
        try {
            await chrome.runtime.sendMessage({
                type: 'searchComplete',
                tabId: originalTabId,
                results: results
            });
        } catch (e) {
        }
        
        // Store results for popup to retrieve
        searchState.lastResults = results;
        searchState.searchComplete = true;
        searchState.lastError = null;
        
        return { success: true, results: results };
        
    } catch (error) {
        // Store error for popup to retrieve
        searchState.lastError = error.message;
        searchState.searchComplete = true;
        searchState.lastResults = [];
        
        return { success: false, error: error.message };
    } finally {
        await cleanupSearch();
    }
}

async function performSearch(origUrl) {
    const currUrl = urlToPdfUrl(origUrl);
    const maxPages = 20; // Safety limit to prevent infinite loops
    let consecutiveEmptyPages = 0;
    
    for (let count = 0; count < maxPages; count++) {
        if (!searchState.isRunning) {
            break; // Search was cancelled
        }
        
        try {
            const newUrl = currUrl.replace(/\&offset=\d+/g, `&offset=${count}`);
            
            await updateHiddenTab(newUrl, searchState.hiddenTabId);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check for captcha before trying to extract links
            const captchaCheck = await checkForCaptcha(searchState.hiddenTabId);
            
            if (captchaCheck.hasCaptcha) {
                // Stop search and notify user about captcha
                searchState.isRunning = false;
                searchState.searchComplete = true;
                searchState.lastError = 'Captcha detected. Please reload the original page, solve any captchas, and restart the search.';
                
                try {
                    await chrome.runtime.sendMessage({
                        type: 'captchaDetected',
                        tabId: searchState.originalTabId,
                        captchaInfo: captchaCheck,
                        message: 'Captcha detected! Please reload the original page, solve any captchas that appear, and restart the search.'
                    });
                } catch (e) {
                }
                
                // Throw error to exit search and trigger cleanup
                throw new Error('Captcha detected. Please reload the original page and restart the search.');
            }
            
            // Check if we've reached the end of results
            const emptyCheck = await checkIfPageEmpty(searchState.hiddenTabId);
            
            if (emptyCheck.isEmpty) {
                // Found empty page - we've reached the end
                break;
            }
            
            const links = await extractLinksFromTab(searchState.hiddenTabId);
            const initialPdfCount = searchState.pdfUrls.size;
            
            for (const link of links) {
                if (isValidUrl(link) && isPdfUrl(link)) {
                    searchState.pdfUrls.add(link);
                }
            }
            
            // Check if we found new PDFs on this page
            const newPdfsFound = searchState.pdfUrls.size > initialPdfCount;
            
            if (!newPdfsFound) {
                consecutiveEmptyPages++;
                // If we haven't found PDFs for 2 consecutive pages, we might be done
                if (consecutiveEmptyPages >= 2) {
                    break;
                }
            } else {
                consecutiveEmptyPages = 0; // Reset counter if we found PDFs
            }
            
            searchState.currentSearchCount = count + 1;
            
            try {
                await chrome.runtime.sendMessage({
                    type: 'searchProgress',
                    tabId: searchState.originalTabId,
                    currentPage: count + 1,
                    totalPages: '?', // Unknown total since we search until empty
                    pdfCount: searchState.pdfUrls.size
                });
            } catch (e) {
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            throw error;
        }
    }
}

async function cleanupSearch() {
    if (searchState.hiddenTabId) {
        await deleteHiddenTab(searchState.hiddenTabId);
    }
    
    searchState.isRunning = false;
    searchState.hiddenTabId = null;
    searchState.originalTabId = null;
    searchState.currentSearchCount = 0;
    // Keep lastResults, lastError, and searchComplete for popup to retrieve
}

async function cancelSearch() {
    if (!searchState.isRunning) {
        return { success: false, error: 'No search in progress' };
    }
    
    searchState.isRunning = false;
    await cleanupSearch();
    
    try {
        await chrome.runtime.sendMessage({
            type: 'searchCancelled',
            tabId: searchState.originalTabId
        });
    } catch (e) {
    }
    
    return { success: true };
}

function getSearchStatus() {
    return {
        isRunning: searchState.isRunning,
        currentPage: searchState.currentSearchCount,
        pdfCount: searchState.pdfUrls.size,
        hiddenTabId: searchState.hiddenTabId,
        searchComplete: searchState.searchComplete,
        lastResults: searchState.lastResults,
        lastError: searchState.lastError
    };
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startSearch') {
        startPdfSearch(request.tabId).then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'cancelSearch') {
        cancelSearch().then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (request.action === 'getSearchStatus') {
        const status = getSearchStatus();
        sendResponse(status);
        return false;
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === searchState.hiddenTabId) {
        searchState.hiddenTabId = null;
        if (searchState.isRunning) {
            searchState.isRunning = false;
            // Notify popup if possible
            try {
                chrome.runtime.sendMessage({
                    type: 'searchInterrupted',
                    tabId: searchState.originalTabId,
                    error: 'Hidden tab was closed unexpectedly'
                });
            } catch (e) {
            }
        }
    }
});

chrome.runtime.onStartup.addListener(() => {
    searchState.isRunning = false;
    searchState.hiddenTabId = null;
    searchState.originalTabId = null;
    searchState.pdfUrls = new Set();
    searchState.currentSearchCount = 0;
});
