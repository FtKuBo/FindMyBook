injectContentScript = (tab) => {
    const {id, url} = tab;

    chrome.scripting.executeScript(
      {
        target: {tabId: id, allFrames: true},
        files: ['/scripts/book-scraping.js']
      }
    )
    
  }

getCurrentTab = async () => {
    let queryOptions = { active: true };

    let [tab] = await chrome.tabs.query(queryOptions);

    return tab;

}

getCurrentTab().then((tab)=>{
    injectContentScript(tab)

  })

newHiddenTab = async (url) => {
    let hiddenTab = await chrome.tabs.create({url: url, active:false});

    return hiddenTab;

}

updateHiddenTab = (url, tabId) => {
    chrome.tabs.update({url: url, tabId: tabId})

}

deleteHiddenTab = (tabId) => {
  // chrome.tabs.remove({tabId:"id"})

}

// message handling
//--------------------------------------------------------------
  
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.code === 200){
      var pdfList = document.getElementById('pdfList');

      request.urls.forEach(element => {
        var listItem = document.createElement('li');

        listItem.textContent = element;

        pdfList.appendChild(listItem);

      });
    }
    
    // replace with swich
    else if (request.code === 201){
      newHiddenTab(request.url).then( async (hiddenTab) => {
        try {
            alert(hiddenTab.id);

            //sending the id of the new hiddenTab
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

            const response = await chrome.tabs.sendMessage(tab.id, {code: 204, hiddenTabId: hiddenTab});

        } catch (error) {
            alert("There has been an error in gathering pdf urls please reload the page ! Error when displaying gathered pdfList")
        }
      })
    }
    
    else if (request.code === 202){
        updateHiddenTab(request.url, request.tabId);

    }

    else if (request.code === 203){
        deleteHiddenTab(request.tabId);

    }
  }
);
