var Url = require("url-parse");

function getBase() {
    var loc = window.location.href;
    var url = new Url(loc);
    if(url.hostname === "localhost") {
        return "https://stage.rjk.xyz";
    } else {
        var hostBits = url.hostname.split(".");
        hostBits.shift();
        return "https://" + hostBits.join(".");
    }
}


const Configs = {
    LOGIN_URL:      getBase() + "/_triggerlogin?redirect_uri=" + window.location.href,
    API_URL:        getBase(),
    PAGE_SIZE:      15
}

export default Configs;