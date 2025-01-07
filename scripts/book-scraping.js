var pdfUrls = new Set();
const origUrl = window.location.href
var currUrl = origUrl + "&offset=0";
var count = 0;
var primaryPage = true;

do{
    getPageUrl()
    window.location.href = currUrl.replace(/&offset=\d+/g, `&offset=${count++}`);
}
while(count <= 10)

window.location.href = origUrl
alert(Array.from(pdfUrls))

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

function explorePage(url){
    let prevUrl = window.location.href;
    setTimeout(() => {
        window.location.href = url;
    }, 100); 
    primaryPage = false;
    getPageUrl();
    setTimeout(() => {
        window.location.href = prevUrl;
    }, 100); 
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