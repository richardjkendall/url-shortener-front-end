import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';

import Configs from './Config';

import './App.css';

class App extends Component { 
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
      token: {}
    }
  }

  getIdToken(url) {
    var url_bits = url.split("#");
    if(url_bits.length > 1) {
      var query_string = url_bits.pop();
      var query_string_bits = query_string.split("&");
      var id_token = "";
      for (const cv of query_string_bits) {
        var cv_bits = cv.split("=");
        if(cv_bits[0] === "id_token") {
          id_token = cv_bits[1]
        }
      }
      return id_token;
    } else {
      return false;
    }
  }

  checkIfTokenExpired(token) {
    var decoded = jwt_decode(token);
    var exp = new Date(decoded.exp * 1000);
    return exp < new Date();
  }

  updateStateWithTokenData(token) {
    var decoded = jwt_decode(token);
    this.setState({
      loggedIn: true,
      token: decoded
    });
  }

  componentDidMount() {
    // need to check if there is a saved and valid JWT
    // if not then check if the URI contains tokens
    // otherwise we need to trigger a login
    var id_token = this.getIdToken(window.location.href);
    var redirect_to_login = false;
    if(id_token) {
      if(this.checkIfTokenExpired(id_token)) {
        // token is expired, so we need a new one
        redirect_to_login = true;
      } else {
        // token is okay, we should store it
        window.localStorage.setItem("urls_jwt", id_token);
        // then go to home so we don't 
        window.location.href = "/";
      }
    } else {
      if(window.localStorage.getItem("urls_jwt") === null) {
        // we have no token
        redirect_to_login = true;
      } else {
        // we have a token
        // check it is not expired
        id_token = window.localStorage.getItem("urls_jwt");
        if(this.checkIfTokenExpired(id_token)) {
          // token is expired, so we need a new one
          // remove it, and go to login
          window.localStorage.removeItem("urls_jwt");
          redirect_to_login = true;
        } else {
          // token is okay, update state with the data
          
        }
      }
    }
    if(redirect_to_login) {
      window.location.href = Configs.LOGIN_URL;
    }
  }

  render() {
    return (
        <div>

        </div>
    );
  }
}

export default App;