chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.code === 204){
        hiddenTab = request.hiddenTab;

        Main();

      }
    }
  );

//getting all safe and pdf urls in a page
//execute this script for a specific tab
function getPageUrl(tab){
    alert("called")
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractLinks
      }, (results) => {
        const links = results[0].result;

        links.forEach(link => {
            if( isValideUrl(link) ) {
                if( isPdfUrl(link) ) {
                    pdfUrls.add(link);

                }

                else if(primaryPage) {
                    explorePage(link);
                }
            }
        });
      });
    alert(pdfUrls);
}

function extractLinks() {
    return Array.from(document.querySelectorAll("a")).map(link => link.href);

  }

async function createHiddenTab(url){
    try {
        const response = await chrome.runtime.sendMessage({code: 201, url: url});

        return response;

      } catch (error) {
        alert("There has been an error in gathering pdf urls please reload the page ! Error in creating new tab.")

      }
}

async function updateHiddenTab(url, tabId){
    try {
        const response = await chrome.runtime.sendMessage({code: 202, url: url, tabId: tabId});

      } catch (error) {
        alert("There has been an error in gathering pdf urls please reload the page ! Error in updating new tab.")

      }
}

async function deleteHiddenTab(tabId){
    try {
        const response = await chrome.runtime.sendMessage({code: 203, tabId: tabId});

      } catch (error) {
        alert("There has been an error in gathering pdf urls please reload the page ! Error in deleting new tab.")

      }
}

function urlToPdfUrl(url){
    return url + "&offset=0";

}

function explorePage(url){
    let prevUrl = window.location.href;

    setTimeout(() => {
        updateHiddenTab(url, hiddenTab.id);

    }, getRndInt(100, 400));

    primaryPage = false;

    getPageUrl();

    setTimeout(() => {
        updateHiddenTab(prevUrl, hiddenTab.id);

    }, getRndInt(100, 400));

    primaryPage = true;

}

function isValideUrl(url){
    try{
        let newUrl = new URL(url);

        return newUrl.protocol === 'https:';

    }
    catch(e){
        return false;

    }
}

function isPdfUrl(url) {
    return url.indexOf(".pdf") !== -1;

}

function getRndInt(min, max){
    return (Math.random() * (max - min + 1)) + min

}

//TODO : 
// find a way to know if there is a next page or not
// find a way to avoid captcha
// enhance the UI of the popup
// adapt it to chrome

var pdfUrls = new Set();

const origUrl = window.location.href;

var currUrl = urlToPdfUrl(origUrl);

var hiddenTab;

//waiting for function to return the tab created
//to define hiddenTab
createHiddenTab(currUrl).then((tab) => {
})

function Main(){
    var count = 0;

    var primaryPage = true;

    var urlAdded = false;

    do{
        urlFound = getPageUrl(hiddenTab);

        updateHiddenTab(currUrl.replace(/&offset=\d+/g, `&offset=${count++}`), hiddenTab.id);

    }
    while(count <10)

    deleteHiddenTab(hiddenTab.id);

    // message handling
    //--------------------------------------------------------------

    (async () => {
        try {
            const response = await chrome.runtime.sendMessage({code: 200, urls: Array.from(pdfUrls)});

        } catch (error) {
            alert("There has been an error in gathering pdf urls please reload the page ! Error when displaying gathered pdfList");
            
        }
    })();
}
