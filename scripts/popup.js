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

// message handling
//--------------------------------------------------------------
  
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.code === 200){
      var pdfList = document.getElementById('pdfList');
      request.urls.forEach(element => {
        var listItem = document.createElement('li');
        listItem.textContent = element;
        pdfList.appendChild(listItem);
      });
    }
    else{
      alert("There has been an error in gathering pdf urls please reload the page !")
    }
    }
);
