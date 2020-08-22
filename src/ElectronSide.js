import React from 'react';

import Video from './Video.js'
import Main from './Main.js'
import LoadingScreen from './LoadingScreen.js'

import { callManager, streamManager, db } from './constants.js';

import { localPreferences } from './LocalPreferences.js';

import './ElectronSide.css';

class ElectronSide extends Main {
  constructor() {
    super();
    this.state.audioMuted = false;
    this.state.videoMuted = false;
  }

  componentDidMount() {
    this.mountKeyboard();

    this.initializeVideoStreams();
    this.initializeOwnSnapshotListener();
    callManager.initialize(this.props.id);
    this.initializeInteract();

    streamManager.setOutQuality(160, 120);
    streamManager.onMuteVideo = (muted) => {
      this.setState({ videoMuted: muted });
    };
    streamManager.onMuteAudio = (muted) => {
      this.setState({ audioMuted: muted });
    };
    window.onresize = () => {
      this.setElectronDims();
    };

    this.outQualityHandle = localPreferences.on("outQuality", (value) => {
      streamManager.setOutQuality(value.width, value.height);
    });
    let outQuality = localPreferences.get("outQuality");
    if (!outQuality) {
      localPreferences.set("outQuality", {width: 160, height: 120});
    } else {
      streamManager.setOutQuality(outQuality.width, outQuality.height);
    }

    document.title = "";
  }

  componentDidUpdate() {
    super.componentDidUpdate();
    this.setElectronDims();
  }

  setElectronDims() {
    let mainElt = document.querySelector('.electron-side');
    let selfVideoElt = document.querySelector('.electron-selfvideo');
    if (!mainElt || !selfVideoElt) {
      return;
    }
    window.api.send('set-side-dims', { 
      height: mainElt.clientHeight + selfVideoElt.clientHeight,
      width: mainElt.clientWidth
    });
  }

  renderVideo(id) {
    return (
      <div className="aspect-preserve">
        <Video
          key={id}
          ownId={this.props.id}
          id={id}
          myStatus={this.state.myStatus}
          stream={this.state.usersStream[id]}
          status={id in this.state.friends ? this.state.friends[id].status : 0}
          inPrivate={id in this.state.friends ? this.state.friends[id].inPrivate : false}
          inCall={id in this.state.friends ? this.state.friends[id].roomId !== "" : false}
          onMobile={id in this.state.friends ? this.state.friends[id].onMobile : false}
          active={id in this.state.friends ? this.state.friends[id].active : true}
          name={id in this.state.friends ? this.state.friends[id].name : "Unknown"}
          profilePicturePath={id in this.state.friends ? this.state.friends[id].profilePicturePath : ""}
          textStatus={""}
          isEnlarged={false}
          inCallWith={id in this.state.inCall}
          enterCall={this.enterCall.bind(this)}
          exitCall={this.exitCall.bind(this)}
        />
      </div>
    );
  }

  changeStatus(newStatus) {
    db.collection('users')
      .doc(this.props.id)
      .update({
        status: newStatus,
        statusTimeout: null,
      });
  }

  toggleMicrophone() {
    streamManager.muteAudioAll(!this.state.audioMuted);
  }

  toggleCamera() {
    streamManager.muteVideoAll(!this.state.videoMuted);
  }

  getFriendIds() {
    const online = (id) => {
      return this.state.pluggedIn[id] && (id in this.state.inCall || (this.state.friends[id].active && [0, 1].includes(this.state.friends[id].status)));
    };
    const test = (id) => {
      return this.state.pluggedIn[id];
    }
    return Object.keys(this.state.friends).filter(online);
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingScreen />
    }

    localPreferences.setDefault("outQuality", {width: 160, height: 120})

    let friendIds = this.getFriendIds();
    return (
      <div id="main" className="main-container electron-main-container">
        <div className="main-flex-container">
          <div className="shade"
            style={this.state.uuid === this.state.controllingUUID ? { display: "none" } : {}}
          >
            <div>INACTIVE</div>
          </div>
          <div id="background" className="content-container electron-content-container">
            <div className="electron-side-container">
            <div className="electron-side">
              {friendIds.map((id) => {
                return this.renderVideo(id);
              })}
            </div>
            </div>
            <div className="electron-selfvideo gray">
              <div className="aspect-preserve">
                <Video
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
              </div>
              <div className="electron-status-buttons">
                <div className={this.state.myStatus === 0 ? "green selected" : "green"} onClick={() => this.changeStatus(0)}></div>
                <div className={this.state.myStatus === 1 ? "red selected" : "red"} onClick={() => this.changeStatus(1)}></div>
                <div className={this.state.myStatus === 2 ? "dim-gray selected" : "dim-gray"} onClick={() => this.changeStatus(2)}></div>
              </div>
              <div className="electron-status">{
                (this.state.myStatus === 0) ? <div>Available</div> :
                  (this.state.myStatus === 1) ? <div>Busy</div> :
                    <div>Offline</div>
              }</div>
              <div className="electron-stream-controls">
                <div><i className="fas fa-arrow-left" onClick={() => { window.api.send("launch-settings") }} /></div>
                <div><i className={this.state.videoMuted ? "fas fa-video-slash" : "fas fa-video"} onClick={this.toggleCamera.bind(this)} /></div>
                <div><i className={this.state.audioMuted ? "fas fa-microphone-slash" : "fas fa-microphone"} onClick={this.toggleMicrophone.bind(this)} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>);
  }
}

export default ElectronSide;
