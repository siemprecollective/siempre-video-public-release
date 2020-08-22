import React from 'react';
import NoSleep from 'nosleep.js';
import interact from 'interactjs';

import All from './All.js';
import CommonsAlt from './CommonsAlt.js';
import Private from './Private.js';
import SelfVideo from './SelfVideo.js';
import TopBar from './TopBar.js';
import Settings from './Settings.js';
import LoadingScreen from './LoadingScreen.js';
import { db, auth, streamManager, callManager, signaling } from './constants.js';
import { touchInfo } from './TouchInfo.js';
import { localPreferences } from './LocalPreferences.js';

import './Main.css';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      myStatus: -1,
      myName: "",
      myTextStatus: null,
      showTopBar: true,
      prevPage: "commons",
      whichPage: "commons",
      commonsView: 0,
      usersStream: {},
      streamOut: null,
      profilePicturePath: "",
      microphoneEnabled: true,
      cameraEnabled: true,
      inCall: {},
      isPrivate: false,
      pluggedIn: {},
      friends: {}
    };
    this.roomUnsubscribe = () => {};

    this.swipeDistance= -1;
  	this.topBarTimer = -1;
    
    this.outQualityHandle = localPreferences.on("outQuality", (value) => {
      streamManager.setOutQuality(value.width, value.height);
    });
  }

  componentWillUnmount() {
    localPreferences.remove("outQuality", this.outQualityHandle);
  }

  componentDidUpdate() {
    this.updateStreamManager();
  }

  componentDidMount() {
    this.mountKeyboard();
    this.initializeVideoStreams();
    this.initializeOwnSnapshotListener();
    callManager.initialize(this.props.id);
    this.initializeInteract();
    
    // TODO it's not clear to me that this works...
    var nosleep = new NoSleep();
    document.addEventListener("click", () => {
      nosleep.enable();
      if (!document.fullscreenElement) {
        this.requestFullscreen();
      }
    }, true);
  }
  
  requestFullscreen() {
    let elem = document.querySelector("#main");
    var requestFullScreen = elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen;
    try {
      requestFullScreen.call(elem);
    } catch (err) {
      console.log(err);
    }
  }

  initializeInteract() {
    let twoFingerSwipeConfig = {
      "onstart": (event) => {
        touchInfo.notifyDragging(true);
        let target = document.getElementsByClassName("main-component")[0];
        this.showTopBar();
        this.swipeDistance = 0;
        target.style.webkitTransform = target.style.transform = "";
      },
      "onmove": (event) => {
        let target = document.getElementsByClassName("main-component")[0];
        let swipeCycle = ["settings", "all", "commons", "private"]

        this.swipeDistance = this.swipeDistance + event.dx;
        target.style.webkitTransform = target.style.transform = "translate("+this.swipeDistance+"px, 0px)";
        if (Math.abs(this.swipeDistance) > 200) {
          let curIndex = swipeCycle.indexOf(this.state.whichPage);
          let swipeRight = this.swipeDistance < 0;
          let nextIndex;
          if (swipeRight) {
            nextIndex = Math.min(curIndex+1, swipeCycle.length-1);
          } else {
            nextIndex = Math.max(curIndex-1, 0);
          }
          this.changeMainComponent(swipeCycle[nextIndex]);
          this.swipeDistance = 0;
          target.style.webkitTransform = target.style.transform = "";
          touchInfo.notifyDragging(false);
  				event.interaction.stop();
        }
      },
      "onend": (event) => {
        touchInfo.notifyDragging(false);
        let target = document.getElementsByClassName("main-component")[0];
        this.swipeDistance = 0;
        target.style.webkitTransform = event.target.style.transform = "";
        if (this.state.whichPage === 'commons' || this.state.whichPage === 'private') {
      		clearTimeout(this.topBarTimer)
          // this.topBarTimer = setTimeout(this.hideTopBar.bind(this), 2000);
        }
      }
    }

    // TODO this next line is a bit hacky
    interact("#commons-alt .video-container").gesturable(twoFingerSwipeConfig);
    interact(".main-component").gesturable(twoFingerSwipeConfig);
  }

  initializeVideoStreams() {
    // set up stream manager
    signaling.onSignal = (id, data) => {
      streamManager.signal(id, data);
    };
    streamManager.onSignal = (id, data) => {
      signaling.signal(id, data);
    };
    streamManager.onStreamIn = (data) => {
      this.setState((prevState) => {
        prevState.usersStream[data.id] = data.stream;
        return prevState
      });
    };
    streamManager.onStreamOut = (stream) => {
      this.setState({
        streamOut: stream
      });
    };

    function genUUID() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    if (!localPreferences.get('uuid')) {
      localPreferences.set('uuid', genUUID());
    }
    let uuid = localPreferences.get('uuid');
    this.setState({"uuid": uuid});
    console.log("UUID", uuid);
    signaling.initialize(uuid);
    streamManager.initialize(auth.currentUser.uid, {
      audio: {latency: {max: 0.02}},
      video: true
    });
    document.querySelector("body").addEventListener("click", () => {
      signaling.assertControl();
    });
  }

  updateStreamManager() {
    if (this.state.myStatus === 2) {
      streamManager.removeAll();
      return;
    }

    Object.keys(this.state.inCall).forEach(id => {
      if (id === this.props.id) { // ignore ourselves
        return;
      }
      // stream with everyone we're in a call with regardless of their status
      streamManager.add(id);
      streamManager.muteVideo(id, false);
      streamManager.muteAudio(id, false);
    });
    Object.keys(this.state.friends).forEach((id) => {
      if (id in this.state.inCall) { // handled by above rules
        return;
      }
      // stream with friends who are not offline
      // if we're in a private call, mute our audio and video,
      // otherwise just mute our audio
      if (this.state.friends[id].status !== 2 &&
          this.state.friends[id].active &&
          this.state.pluggedIn[id]) {
        if (this.state.isPrivate) {
          streamManager.add(id);
          streamManager.muteVideo(id, true);
          streamManager.muteAudio(id, true);
        } else {
          streamManager.add(id);
          streamManager.muteVideo(id, false);
          streamManager.muteAudio(id, true);
        }
      } else {
        streamManager.remove(id);
      }
    });
    // TODO this uses a streamManager private API
    Object.keys(streamManager._streams).forEach(id => {
      // don't stream with anyone else we've been streaming with
      if (id in this.state.inCall || id in this.state.friends) {
        return; // handled by above rules
      }
      streamManager.remove(id);
    });
  }

  initializeOwnSnapshotListener() {
    db.collection("users").doc(this.props.id)
      .onSnapshot((doc) => {
        let pluggedIn = doc.data()["pluggedIn"];
        let newStatus = doc.data()["status"];
        let newName = doc.data()["name"];
        let controllingUUID = doc.data()["controllingUUID"];
        let newTextStatus = doc.data()["textStatus"];
        if (newStatus !== this.state.myStatus) {
          if (newStatus === 2) {
            this.exitCall();
          }
        }
        this.setState({
          myStatus: newStatus,
          myName: newName,
          pluggedIn: pluggedIn,
          controllingUUID: controllingUUID,
          myTextStatus: newTextStatus,
          loaded: true
        });
        let newPicturePath = doc.data()["profilePicturePath"];
        if (newPicturePath) {
          this.setState({profilePicturePath: newPicturePath});
        }
        let roomId = "roomId" in doc.data() ? doc.data()["roomId"] : "";
        if (roomId !== "") {
          this.roomUnsubscribe();
          this.roomUnsubscribe = db.collection("rooms").doc(roomId).onSnapshot((doc) => {
            if (!doc.exists || Object.keys(doc.data()["users"]).length <= 1) {
              this.roomUnsubscribe();
            } else {
              let newInCall = doc.data()["users"];
              delete newInCall[this.props.id];
              this.setState({
                isPrivate: doc.data()["isPrivate"],
                inCall: newInCall,
              });
              if (doc.data()["isPrivate"]) {
                this.changeMainComponent("private");
              }
            }
          });
        } else {
          this.setState({
            isPrivate: false,
            inCall: {}
          });
          this.roomUnsubscribe();
        }
      });

    db.collection("statuses").doc(this.props.id)
      .onSnapshot((doc) => {
        if (!doc.exists) return;
        this.setState({friends: doc.data()});
      });
  }

  enterCall(toId, isPrivate) {
    if (!(toId in this.state.friends) || this.state.friends[toId].status !== 0 || !this.state.friends[toId].active || this.state.myStatus === 2) {
      return;
    }
  	callManager.enter(toId, isPrivate);
  }

  exitCall() {
  	callManager.exit();
    if (this.state.whichPage !== "commons") {
      this.changeMainComponent("commons");
    }
  }

  addPrivateId(toId) {
    if (!(toId in this.state.friends) || this.state.friends[toId].status !== 0 || !this.state.friends[toId].active || this.state.myStatus === 2) {
      return;
    }
    this.enterCall(toId, true);
    this.changeMainComponent("private");
  }

  showTopBar() {
    this.setState({ showTopBar: true });
  }

  hideTopBar() {
    if (this.state.whichPage === 'commons' || this.state.whichPage === 'private') {
      this.setState({ showTopBar: false });
    }
  }

  changeMainComponent(component) {
    this.setState({
      prevPage: (this.state.whichPage === this.state.prevPage ? this.state.prevPage: this.state.whichPage),
      whichPage: component,
      showTopBar: true
    });
    if (component === 'commons' || component === 'private') {
  		clearTimeout(this.topBarTimer)
      // this.topBarTimer = setTimeout(this.hideTopBar.bind(this), 2000);
    }
  }

  changeCommonsView() {
    this.setState({commonsView: (this.state.commonsView + 1) % 2});
  }

  pageNameToNumber(pageName) {
    if(pageName === 'settings'){
      return 0;
    }
    else if(pageName === 'all'){
      return 1;
    }
    else if(pageName === 'commons'){
      return 2;
    }
    else if(pageName === 'private'){
      return 3;
    }
  }

  pageNumberToName(pageNumber) {
    if(pageNumber === 0){
      return 'settings';
    }
    else if(pageNumber === 1){
      return 'all';
    }
    else if(pageNumber === 2){
      return 'commons';
    }
    else if(pageNumber === 3){
      return 'private';
    }
  }

  mountKeyboard() {
    document.addEventListener("keydown", (e) => {
      console.log("keyboard")
      if (e.code === "ArrowLeft"){

        this.setState({
          prevPage: this.state.whichPage
        });

        let n = this.pageNameToNumber(this.state.whichPage);

        this.setState({
          whichPage: this.pageNumberToName(Math.max(n - 1,0))
        });
      }
      else if (e.code === "ArrowRight"){
        console.log("right")
        this.setState({
          prevPage: this.state.whichPage
        });

        let n = this.pageNameToNumber(this.state.whichPage);

        this.setState({
          whichPage: this.pageNumberToName(Math.min(n + 1,3))
        });
      }
    });
  }

  render() {
    localPreferences.setDefault("outQuality", {width: 1280, height: 720})
    if (!this.state.loaded) {
      return (
        <div id="main" className="main-container">
          <LoadingScreen />
        </div>
      );
    }

    return (
      <div id="main" className="main-container">
        <div className="main-flex-container">
          <div className="shade"
            style={this.state.uuid === this.state.controllingUUID ? {display: "none"} : {}}
          >
            <div>Running on another device</div>
          </div>
          <div id="background" className="content-container">
            <SelfVideo
              ownId={this.props.id}
              id={this.props.id}
              stream={this.state.streamOut}
              status={this.state.myStatus}
              textStatus={this.state.myTextStatus}
              inPrivate={false} // TODO different in commons and private
              inCall={false} // TODO
              inCallWith={false} // TODO
              active={true} // TODO
              name={this.state.myName}
              profilePicturePath={this.state.profilePicturePath}
              isSelf={true}
            />
            <TopBar
              selected={this.state.whichPage}
              changePage={this.changeMainComponent.bind(this)}
              display={this.state.showTopBar}
              pages={[["settings", "Settings"], ["all", "All Friends"], ["commons", "Commons"], ["private", "Private"]]}
            />
            <div className="main-component">
              <All
                id={this.props.id}
                display={this.state.whichPage === "all"}
                friends={this.state.friends}
                pluggedIn={this.state.pluggedIn}
              />
              <CommonsAlt
                display={this.state.whichPage === "commons"}
                id={this.props.id}
                myStatus={this.state.myStatus}
                usersStream={this.state.usersStream}
                pluggedIn={this.state.pluggedIn}

                inCall={this.state.inCall}
                isPrivate={this.state.isPrivate}
                friends={this.state.friends}

                enterCall={this.enterCall.bind(this)}
                exitCall={this.exitCall.bind(this)}
                addPrivateId={this.addPrivateId.bind(this)}
                changeCommonsView={this.changeCommonsView.bind(this)}
              />
              <Private
                display={this.state.whichPage === "private"}
                usersStream={this.state.usersStream}
                ids={this.state.isPrivate ? Object.keys(this.state.inCall) : []}
                exitCall={this.exitCall.bind(this)}
              />
              <Settings
                display={this.state.whichPage === "settings"}
                id={this.props.id}
                name={this.state.myName}
                profilePicturePath={this.state.profilePicturePath}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Main;
