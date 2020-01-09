import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import isURL from 'validator/lib/isURL';

import { Grommet, Box, Heading, Text, TextInput, Button, Menu, Layer } from 'grommet';
import { Menu as MenuIcon } from 'grommet-icons'
import { grommet } from "grommet/themes";

import Configs from './Config';
import ApiHandler from './Api';
import LinksTable from './LinksTable';

import './App.css';

const Header = (props) => (
  <Box
    tag='header'
    background='brand'
    pad='small'
    elevation='small'
    justify='between'
    direction='row'
    align='center'
    flex={false}
  >
    <Heading level={3} margin='none'>
      <strong>URL Shortener</strong>
    </Heading>
    <Menu
      dropAlign={{ top: 'bottom', right: 'right' }}
      items={[
        { label: "Logged in as " + props.userName, disabled: true },
        { label: "Logout", onClick: () => {
          // need to logout
          props.logout();
        } }
      ]}
      icon={<MenuIcon color='white' />}
    />
    
  </Box>
);

const Footer = (props) => (
  <Box
    tag='footer'
    direction='row'
    justify='end'
    pad='medium'
    border={{ side: 'top' }}
    gap='small'
    flex={false}
  >
    <Button label='Remove' color='border' onClick={() => {}} />
    <Button label='Add' primary={true} onClick={() => {props.add()}} />
  </Box>
);

const AddLink = (props) => {
  const [url, setUrl] = React.useState("");
  const [controlsDisabled, setControlsDisabled] = React.useState(false);
  
  const callAddLink = function() {
    console.log("in calladdlink", url);
    if(isURL(url)) {
      setControlsDisabled(true);
      var apiClient = new ApiHandler(props.token);
      apiClient.addLink(url, (data) => {
        setControlsDisabled(false);
        setUrl("");
        props.success();
      }, () => {
        console.log("error adding link");
      });
    } else {
      console.log(url, "is not a valid URL");
    }
  }

  return (
    <div>
      {props.open && (
        <Layer position="center" modal onClickOutside={props.close} onEsc={props.close}>
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Add New Link</Heading>
            <Text>Please enter the URL for the link you want to add</Text>
            <TextInput 
              placeholder="url..."
              value={url}
              onChange={event => setUrl(event.target.value)}
              disabled={controlsDisabled}
            />
            <Box 
              as="footer"
              gap="small"
              direction="row"
              align="center"
              justify="end"
              pad={{top: "medium", bottom: "small"}}
            >
              <Button 
                label="Cancel" 
                color="border" 
                onClick={props.close} 
                disabled={controlsDisabled}
              />
              <Button
                label={
                  <Text color="white">
                    <strong>Add Link</strong>
                  </Text>
                }
                primary
                onClick={callAddLink}
                disabled={controlsDisabled}
              />
            </Box>
          </Box>
        </Layer>
      )}
    </div>
  )

};

class App extends Component { 
  constructor(props) {
    super(props);
    this.addLink = {};
    this.state = {
      loggedIn: false,
      token: {},
      links: []
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
    console.log(decoded);
    this.setState({
      loggedIn: true,
      originalToken: token,
      token: decoded,
      addLinkOpen: false
    });
  }

  logoutUser() {
    alert("log out");
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
        console.log(id_token);
        if(this.checkIfTokenExpired(id_token)) {
          // token is expired, so we need a new one
          // remove it, and go to login
          window.localStorage.removeItem("urls_jwt");
          redirect_to_login = true;
        } else {
          // token is okay, update state with the data
          this.updateStateWithTokenData(id_token);
          this.getLinks(id_token);
        }
      }
    }
    if(redirect_to_login) {
      window.location.href = Configs.LOGIN_URL;
    }
  }

  getLinks(token) {
    var apiClient = new ApiHandler(token);
    apiClient.getLinks((data) => {
      console.log("got links");
      console.log(data);
      this.setState({
        links: data
      });
    }, () => {
      console.log("error getting links");
    })
  }

  openAddLinkWindow() {
    console.log("open add link box");
    this.setState({
      addLinkOpen: true
    });
  }

  closeAddLinkWindow() {
    console.log("close add link box");
    this.setState({
      addLinkOpen: false
    });
  }

  linkAddSuccessCallback() {
    this.setState({
      addLinkOpen: false
    });
    this.getLinks(this.state.originalToken);
  }

  render() {
    if(this.state.loggedIn) {
      return (
        <Grommet theme={grommet} full={true}>
          <Box fill={true}>
            <Header userName={this.state.token["cognito:username"]} logout={this.logoutUser} />
            <Box flex={true} pad='medium' overflow='auto'>
              <Box flex={false}>
                <Heading level={3} margin='none'>
                  <strong>My Short URLs</strong>
                </Heading>
                <Box pad={{ top: 'medium' }} gap='small'>
                  <LinksTable links={this.state.links}></LinksTable>
                </Box>
              </Box>
            </Box>
            <Footer add={this.openAddLinkWindow.bind(this)} />
          </Box>
          <AddLink 
            open={this.state.addLinkOpen} 
            close={this.closeAddLinkWindow.bind(this)} 
            token={this.state.originalToken}
            success={this.linkAddSuccessCallback.bind(this)}
          />
        </Grommet>
      );
    } else {
      return (
        <div></div>
      );
    }
  }
}

export default App;