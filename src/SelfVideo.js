import React from 'react';
import interact from 'interactjs';

import "./SelfVideo.css";

import Video from './Video.js';
import { db, streamManager } from './constants.js';

class SelfVideo extends React.Component {
  constructor() {
    super();
    this.state = {
      audioMuted: false,
      videoMuted: false,
      showMenu: false,
      textStatus: "Enter status here...",
    };

    this.x = 0;
    this.swipeY = 0;
    this.isTyping = false;
  }

  componentDidMount() {
    interact(".self-video .video-container").draggable({
      onstart: (event) => {
        this.swipeY = 0;
      },
      onmove: (event) => {
        this.x = this.x + event.dx;
        event.target.parentNode.style.webkitTransform = event.target.parentNode.style.transform = "translate("+this.x+"px, 0px)";
        this.swipeY += event.dy;
        if (this.swipeY < -50) {
          this.setState({showMenu: true});
        } else if (this.swipeY > -50) {
          this.setState({showMenu: false});
        }
      },
    });

    interact(".self-video").draggable({
      onstart: (event) => {
        this.swipeY = 0;
      },
      onmove: (event) => {
        this.swipeY += event.dy;
        if (this.swipeY < -50) {
          this.setState({showMenu: true});
        } else if (this.swipeY > 50) {
          this.setState({showMenu: false});
        }
      }
    });

    streamManager.onMuteVideo = (muted) => {
      this.setState({videoMuted: muted});
    };
    streamManager.onMuteAudio = (muted) => {
      this.setState({audioMuted: muted});
    };

    this.updateTextStatusFromMain(this.props.textStatus);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.textStatus !== this.props.textStatus) {
      this.updateTextStatusFromMain(this.props.textStatus);
    }
  }

  updateTextStatusFromMain(newTextStatus) {
    if (!this.isTyping) {
      console.log('update status from main');
      if (newTextStatus === '') {
        this.setState({textStatus: "Enter status here..."});
      } else {
        this.setState({textStatus: newTextStatus});
      }
    }
  }

  updateStatus(status) {
    db.collection('users').doc(this.props.id).update({
      status: status,
      statusTimeout: null,
    });
    this.setState({showMenu: false});
  }

  toggleMicrophone() {
    streamManager.muteAudioAll(!this.state.audioMuted);
  }

  toggleCamera() {
    streamManager.muteVideoAll(!this.state.videoMuted);
  }

  toggleMenu() {
    this.setState({showMenu: !this.state.showMenu});
  }

  textOnChange(e) {
    this.setState({textStatus: e.target.value});
  }

  onTextUnfocus() {
    this.isTyping = false;
    db.collection('users').doc(this.props.id).update({
      textStatus: this.state.textStatus
    });
  }

  render() {
    let dimColor      = "dim-gray";
    let lightColor = "light-gray";
    if (this.props.status === 0) {
      dimColor = "dim-green";
      lightColor = "light-green";
    } else if (this.props.status === 1) {
      dimColor = "dim-red";
      lightColor = "light-red";
    } else if (this.props.status === 2) {
      dimColor = "dim-gray";
      lightColor = "light-gray";
    }

    return (
      <div className={"self-video"}>
        <Video {...this.props} />
        <div className={"self-text-status-container" + " " + lightColor}>
          <textarea
            className={"self-text-status" + " " + dimColor}
            value={this.state.textStatus}
            onChange={this.textOnChange.bind(this)}
            onFocus={() => {this.isTyping = true}}
            onBlur={this.onTextUnfocus.bind(this)}
          />
        </div>
        <div className={"context-indicator " + (this.state.showMenu? "down" : "up") + " " + dimColor} onClick={this.toggleMenu.bind(this)}>
          <div><i className="fas fa-chevron-up" /></div>
        </div>
        <div className={"status-menu " + (this.state.showMenu? "" : "no-display") + " " + lightColor}>

          <div onClick={this.updateStatus.bind(this, 0)} style={{color: "green"}}>   <div>available</div></div>
          <div onClick={this.updateStatus.bind(this, 1)} style={{color: "red"}}>     <div>busy</div></div>
          <div onClick={this.updateStatus.bind(this, 2)} style={{color: "#505050"}}> <div>offline</div></div>
          <div className={"stream-controls"+(this.props.status === 2 ? " no-display" : "")}>
            <div><i className={this.state.videoMuted? "fas fa-video-slash": "fas fa-video"} onClick={this.toggleCamera.bind(this)} /></div>
            <div><i className={this.state.audioMuted? "fas fa-microphone-slash": "fas fa-microphone"} onClick={this.toggleMicrophone.bind(this)} /></div>
          </div>
        </div>
      </div>
    );
  }
}

export default SelfVideo;
