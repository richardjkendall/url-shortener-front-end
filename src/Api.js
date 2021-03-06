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
            success_callback(response.data.links);
        }).catch(function(error) {
            failure_callback();
        });
    }

    getLinksPage(page_number, page_size, url_filter, linkid_filter, success_callback, failure_callback) {
        console.log("in paginated get links, page is", page_number, ", token is", this.api_key);
        var self = this;
        axios({
            method: "post",
            url: Configs.API_URL + "/",
            responseType: "json",
            headers: { "Authorization": self.api_key },
            data: {
                action: "list",
                page: page_number,
                page_size: page_size,
                filter: {
                    url: url_filter,
                    linkid: linkid_filter
                }
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

    deleteLink(link_id, success_callback, failure_callback) {
        console.log("deleting link, linkid is", link_id, "token is", this.api_key);
        var self = this;
        axios({
            method: "post",
            url: Configs.API_URL + "/",
            responseType: "json",
            headers: {"Authorization": self.api_key},
            data: {
                action: "delete",
                linkid: link_id
            }
        }).then(function(response) {
            success_callback(response.data);
        }).catch(function(error) {
            failure_callback();
        })
    }
}

export default ApiHandler;