//TODO : 
// find a way to know if there is a next page or not
// find a way to avoid captcha
// enhance the UI of the popup
// adapt it to chrome

var pdfUrls = new Set();
const origUrl = window.location.href;
var currUrl = urlToPdfUrl(origUrl);
window.location.href = currUrl;
var count = 0;
var primaryPage = true;
var urlAdded = false;

//getting all safe and pdf urls in a page
function getPageUrl(){
    const links = document.getElementsByTagName('a');
    [...links].forEach((link) => {
        const url = link.getAttribute('href');
        if( isValideUrl(url) ) {
            if( isPdfUrl(url) ){
                pdfUrls.add(url)
            }
            else if(primaryPage){
                explorePage(url)
            }
        }
    });
}

function urlToPdfUrl(url){
    return url + "&offset=0"
}

function explorePage(url){
    let prevUrl = window.location.href;
    setTimeout(() => {
        window.location.href = url;
    }, getRndInt(100, 400)); 
    primaryPage = false;
    getPageUrl();
    setTimeout(() => {
        window.location.href = prevUrl;
    }, getRndInt(100, 400)); 
    primaryPage = true;
}

function isValideUrl(url){
    try{
        let newUrl = new URL(url);
        return newUrl.protocol === 'https:';;
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

do{
    urlFound = getPageUrl();
    window.location.href = currUrl.replace(/&offset=\d+/g, `&offset=${count++}`);
}
while(count <10)

window.location.href = origUrl;

// message handling
//--------------------------------------------------------------

(async () => {
    try {
        const response = await chrome.runtime.sendMessage({code: 200, urls: Array.from(pdfUrls)});
      } catch (error) {
        alert("There has been an error in gathering pdf urls please reload the page !")
      }
  })();