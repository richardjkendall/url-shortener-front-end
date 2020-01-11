import React, { Component } from 'react';
import jwt_decode from 'jwt-decode';
import isURL from 'validator/lib/isURL';

import { Grommet, Box, Heading, Text, TextInput, Button, Menu, Layer } from 'grommet';
import { Menu as MenuIcon, Next, Previous } from 'grommet-icons'
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
    <Button label='Remove' color='border' onClick={() => {props.remove()}} />
    <Button label='Add' primary={true} onClick={() => {props.add()}} />
  </Box>
);

const copyToClipboard = (linkid) => {
  console.log("put link on clipboard", Configs.API_URL, "/", linkid);
  var text = Configs.API_URL + "/" + linkid;
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
}

const AddLink = (props) => {
  const [urlAdded, setUrlAdded] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [controlsDisabled, setControlsDisabled] = React.useState(false);
  const [linkid, setLinkid] = React.useState("");

  const callAddLink = function() {
    console.log("in calladdlink", url);
    if(isURL(url)) {
      setControlsDisabled(true);
      var apiClient = new ApiHandler(props.token);
      apiClient.addLink(url, (data) => {
        console.log(data);
        setControlsDisabled(false);
        setUrl("");
        setError("");
        setLinkid(data.linkid);
        copyToClipboard(data.linkid);
        setUrlAdded(true);
      }, () => {
        console.log("error adding link");
      });
    } else {
      setError("This is not a valid URL");
      console.log(url, "is not a valid URL");
    }
  }

  const closeAddedSuccessWindow = function() {
    setUrlAdded(false);
    props.success(linkid);
  }

  const closeAndClear = function() {
    setControlsDisabled(false);
    setUrl("");
    setError("");
    props.close();
  }

  return (
    <div>
      {props.open && (
        <Layer position="center" modal onClickOutside={closeAndClear} onEsc={closeAndClear}>
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Add New Link</Heading>
            <Text>Please enter the URL for the link you want to add</Text>
            <TextInput 
              placeholder="url..."
              value={url}
              onChange={event => setUrl(event.target.value)}
              disabled={controlsDisabled}
            />
            {error!=="" && 
            <Text color="status-error">{error}</Text>}
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
                onClick={closeAndClear} 
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
          <AddedMessage open={urlAdded} close={closeAddedSuccessWindow} linkid={linkid} />
        </Layer>
      )}
    </div>
  )

};

const AddedMessage = (props) => {

  return(
    <div>
      {props.open &&
        <Layer position="center" modal onClickOutside={props.close} onEsc={props.close}>
          <Box pad="medium" gap="small" width="large">
            <Heading level={3} margin="none">Link Added</Heading>
            <Text>Short URL is: <strong>{Configs.API_URL}/{props.linkid}</strong></Text>
            <Text>This has been copied to your Clipboard</Text>
            <Box 
              as="footer"
              gap="small"
              direction="row"
              align="center"
              justify="end"
              pad={{top: "medium", bottom: "small"}}
            >
              <Button
                label={
                  <Text color="white">
                    <strong>Okay</strong>
                  </Text>
                }
                primary
                onClick={props.close}
              />
            </Box>
          </Box>
        </Layer>
      }
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
      links: [],
      selectedLink: "",
      totalLinkCount: 0,
      currentPage: 0,
      prevDisabled: true,
      nextDisabled: true
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
          this.getLinks(id_token, 0);
        }
      }
    }
    if(redirect_to_login) {
      window.location.href = Configs.LOGIN_URL;
    }
  }

  getLinks(token, page) {
    var apiClient = new ApiHandler(token);
    apiClient.getLinksPage(page, Configs.PAGE_SIZE, (data) => {
      console.log("got links");
      console.log(data);
      console.log("next enabled, total pages:", data.total_number / Configs.PAGE_SIZE);
      this.setState({
        links: data.links,
        totalLinkCount: data.total_number,
        currentPage: page,
        nextDisabled: page >= Math.floor((data.total_number / Configs.PAGE_SIZE)),
        prevDisabled: page == 0
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

  linkAddSuccessCallback(linkid) {
    console.log("in link add success callback, linkid is", linkid);
    this.setState({
      addLinkOpen: false,
      selectedLink: linkid
    });
    this.getLinks(this.state.originalToken, 0);
  }

  selectLink(linkid) {
    this.setState({
      selectedLink: linkid
    });
  }

  deleteLink() {
    var apiClient = new ApiHandler(this.state.originalToken);
    apiClient.deleteLink(this.state.selectedLink, (data) => {
      this.getLinks(this.state.originalToken, this.state.currentPage);
    }, () => {
      console.log("error deleting link");
    });
  }

  nextPage() {
    if(this.state.currentPage < Math.floor((this.state.totalLinkCount / Configs.PAGE_SIZE))) {
      this.getLinks(this.state.originalToken, this.state.currentPage + 1);
    }
  }

  prevPage() {
    if(this.state.currentPage > 0) {
      this.getLinks(this.state.originalToken, this.state.currentPage - 1);
    }
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
                  <LinksTable 
                    links={this.state.links}
                    selectLink={this.selectLink.bind(this)}
                    selectedLink={this.state.selectedLink}
                    page={this.state.currentPage}
                    pageSize={Configs.PAGE_SIZE}
                    totalNumber={this.state.totalLinkCount}
                  />
                </Box>
                <Box align="end" pad="none" direction="row">
                  <Button hoverIndicator="light-1" disabled={this.state.prevDisabled} onClick={this.prevPage.bind(this)}>
                    <Box pad="small" direction="row" align="center" gap="small">
                      <Previous />
                      <Text>Previous</Text>
                    </Box>
                  </Button>
                  <Button hoverIndicator="light-1" disabled={this.state.nextDisabled} onClick={this.nextPage.bind(this)}>
                    <Box pad="small" direction="row" align="center" gap="small">
                      <Next />
                      <Text>Next</Text>
                    </Box>
                  </Button>
                </Box>
              </Box>
            </Box>
            <Footer 
              add={this.openAddLinkWindow.bind(this)} 
              remove={this.deleteLink.bind(this)}
            />
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