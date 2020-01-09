import Configs from './Config';
import axios from 'axios';

class ApiHandler {
    constructor(api_key) {
        console.log("Constructing ApiHandler with token", api_key);
        this.api_key = api_key;
    }

    getLinks(success_callback, failure_callback) {
        console.log("in get links, token is, ", this.api_key);
        var self = this;
        axios({
            method: "post",
            url: Configs.API_URL + "/",
            responseType: "json",
            headers: { "Authorization": self.api_key },
            data: {
                action: "list"
            }
        }).then(function(response) {
            success_callback(response.data);
        }).catch(function(error) {
            failure_callback();
        });
    }

    addLink(new_url, success_callback, failure_callback) {
        console.log("adding url, url is", new_url, "token is", this.api_key);
        var self = this;
        axios({
            method: "post",
            url: Configs.API_URL + "/",
            responseType: "json",
            headers: {"Authorization": self.api_key},
            data: {
                action: "add",
                url: new_url
            }
        }).then(function(response) {
            success_callback(response.data);
        }).catch(function(error) {
            failure_callback();
        })
    }
}

export default ApiHandler;