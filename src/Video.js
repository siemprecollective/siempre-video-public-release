import React from 'react';
import VideoMenu from './VideoMenu.js';
import DisconnectedRed from './res/disconnected-red.png';
import DisconnectedGreen from './res/disconnected-green.png';
import DisconnectedBlue from './res/disconnected-blue.png';
import PhoneRed from './res/phone-red.png';
import PhoneGreen from './res/phone-green.png';
import PhoneBlue from './res/phone-blue.png';
import PrivateRed from './res/private-red.png';
import './Video.css';

import {touchInfo} from './TouchInfo.js';
import {db, storage, streamManager, pixelDragThreshold, msHoldThreshold} from './constants.js';
import {getConversationId} from './utils.js';

import {StreamState} from 'siemprevideo-streamlib';

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      profilePictureURL: '',
      videoMenu: false,
      messages: [],
      streamState: StreamState.kNotTracking,
    };

    this.listeningConversation = false;
  }

  componentDidMount() {
    streamManager.onStreamUpdate(this.props.id, info => {
      console.log(this.props.id, info.state);
      this.setState({streamState: info.state});
    });
    if (this.props.profilePicturePath) {
      storage
        .ref()
        .child(this.props.profilePicturePath)
        .getDownloadURL()
        .then(url => {
          this.setState({profilePictureURL: url});
        })
        .catch(err => {
          console.log(err);
        });
    }
    this.updateVideo();
    this.initConversationsListener();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.profilePicturePath !== this.props.profilePicturePath) {
      storage
        .ref()
        .child(this.props.profilePicturePath)
        .getDownloadURL()
        .then(url => {
          this.setState({profilePictureURL: url});
        })
        .catch(err => {
          console.log(err);
        });
    }
    this.updateVideo();
    this.initConversationsListener();
  }

  componentWillUnmount() {
    this.conversationsListenerRemove();
  }

  initConversationsListener() {
    if (this.props.ownId && !this.listeningConversation) {
      this.listeningConversation = true;
      this.conversationsListenerRemove = db
        .collection('conversations')
        .doc(getConversationId(this.props.ownId, this.props.id))
        .collection('messages')
        .where('seen', '==', false)
        .where('to', '==', this.props.ownId)
        .orderBy('time')
        .onSnapshot(
          querySnapshot => {
            var messages = [];
            querySnapshot.forEach(doc => {
              messages.push({
                id: doc.id,
                path: doc.data().path,
                type: doc.data().type,
                time: doc.data().time,
              });
            });
            this.setState({messages: messages});
          },
          err => console.log('snapshot error ' + getConversationId(this.props.ownId, this.props.id) + ': ' + err),
        );
    }
  }

  updateVideo() {
    var videoContainer = document.querySelector('#video_container_' + this.props.id);
    streamManager.setSizeHint(this.props.id, videoContainer.clientWidth, videoContainer.clientHeight);
    
    if (!this.props.stream) {
      return;
    }
    var video = document.querySelector('#video_' + this.props.id);
    if (video === null) {
      return;
    }
    if (this.props.inCallWith) {
      video.muted = false;
    } else {
      video.muted = true;
    }
    if ('srcObject' in video) {
      if (!video.srcObject) {
        video.srcObject = this.props.stream;
        video.play();
      } else if (this.props.stream !== video.srcObject) {
        try {
          video.pause();
          video.srcObject = this.props.stream;
          video.play();
        } catch (err) {
          console.log('error', err);
        }
      }
    } else {
      if (!video.src) {
        video.pause();
        video.src = window.URL.createObjectURL(this.props.stream); // for older browsers
        video.play();
      } else if (this.props.stream !== video.src) {
        video.pause();
        video.src = window.URL.createObjectURL(this.props.stream); // for older browsers
        video.play();
      }
    }
  }

  onTouchVideoDown() {
    touchInfo.interactionStart();
    if (this.props.isSelf || this.state.videoMenu) {
      return;
    }
    var video = document.querySelector('#video_container_' + this.props.id);
    video.classList.add('animate-fill');
    this.timeStart = new Date().getTime();
    this.holdTimeout = setTimeout(() => {
      video.classList.remove('animate-fill');
      // this can be 0 if you're on desktop
      if (touchInfo.nTouches > 1) {
        return;
      }
      if (!touchInfo.dragging()) {
        this.setState({videoMenu: true});
      }
    }, msHoldThreshold);
  }

  onTouchVideoUp() {
    var video = document.querySelector('#video_container_' + this.props.id);
    video.classList.remove('animate-fill');

    if (this.props.isSelf || this.state.videoMenu) {
      return;
    }
    clearTimeout(this.holdTimeout);
    if (touchInfo.nTouches > 1) {
      return;
    }

    let timeNow = new Date().getTime();
    if (!touchInfo.wasDrag && timeNow - this.timeStart < msHoldThreshold) {
      if (!video.classList.contains('video-container-movable')) {
        if (this.props.inCallWith) {
          video.style.borderColor = 'rgba(0, 204, 255, 1)';
          video.style.borderStyle = 'dashed';
          setTimeout(() => {
            video.style.borderColor = '';
            video.style.borderStyle = '';
          }, 1000);
          this.props.exitCall();
        } else {
          if (this.props.status === 0 && !this.props.inPrivate && this.props.active) {
            video.style.borderColor = 'rgba(0, 204, 255, 1)';
            video.style.borderStyle = 'dashed';
            setTimeout(() => {
              video.style.borderColor = '';
              video.style.borderStyle = '';
            }, 1000);
            this.props.enterCall(this.props.id);
          }
        }
      }
    }
  }

  closeMenu() {
    this.setState({videoMenu: false});
  }

  render() {
    let colorClass = '';
    let dimColor = '';
    let backgroundColorClass = '';
    if (this.props.inCallWith) {
      colorClass = 'blue';
      dimColor = 'dim-blue';
      backgroundColorClass = 'light-blue';
    } else if (!this.props.active) {
      colorClass = 'gray';
      dimColor = 'dim-gray';
      backgroundColorClass = 'light-gray';
    } else if (this.props.inCall) {
      colorClass = 'red';
      dimColor = 'dim-red';
      backgroundColorClass = 'light-red';
    } else if (this.props.status === 0) {
      colorClass = 'green';
      dimColor = 'dim-green';
      backgroundColorClass = 'light-green';
    } else if (this.props.status === 1) {
      colorClass = 'red';
      dimColor = 'dim-red';
      backgroundColorClass = 'light-red';
    } else if (this.props.status === 2) {
      colorClass = 'gray';
      dimColor = 'dim-gray';
      backgroundColorClass = 'light-gray';
    }

    let videoVisible =
      (this.props.ownId === this.props.id && [0, 1].includes(this.props.status)) || this.state.streamState === StreamState.kStreaming || this.state.streamState === StreamState.kBroken;

    let inCallStatus = '';
    if (this.props.inPrivate && !this.props.inCallWith) {
      inCallStatus = 'is in private';
    }

    let streamStatus = '';
    if (this.state.streamState === StreamState.kResetting || this.state.streamState === StreamState.kInitializing) {
      streamStatus = 'connecting...';
    } else if (this.state.streamState === StreamState.kBroken) {
      streamStatus = 'lost connection';
    }

    let isOnMobileStatus = '';
    if (this.props.onMobile) {
      isOnMobileStatus = 'is on mobile';
    }

    let isTalkingToYou = this.props.inCallWith ? "is talking to you" : "";

    let textStatus = this.props.textStatus;

    let textContent = null;
    if (textStatus) {
      textContent = <div className={'text-dot ' + colorClass}>T</div>;
      if (this.props.isEnlarged) {
        textContent = <div className={'text-on-large text-status ' + backgroundColorClass}>{textStatus}</div>;
      }
    }

    let infoIcon = null;
    let infoText;

    if (this.props.onMobile) {
      if (colorClass === 'blue') {
        infoIcon = PhoneBlue;
      } else if (colorClass === 'red') {
        infoIcon = PhoneRed;
      } else if (colorClass === 'green') {
        infoIcon = PhoneGreen;
      }
    } else if (streamStatus !== "") {
      if (colorClass === 'blue') {
        infoIcon = DisconnectedBlue;
      } else if (colorClass === 'red') {
        infoIcon = DisconnectedRed;
      } else if (colorClass === 'green') {
        infoIcon = DisconnectedGreen;
      }
    } else if (inCallStatus !== '') {
      infoIcon = PrivateRed;
    }
    infoText = isOnMobileStatus || streamStatus || inCallStatus || isTalkingToYou;

    let videoComponent = null;
    if (this.props.isSelf) {
      videoComponent = (
        <>
          {videoVisible ? (
            <div className="full-size">
              <video className={dimColor + ' ' + (videoVisible ? '' : 'hidden')} id={'video_' + this.props.id} muted></video>
            </div>
          ) : (
            <div className="small-main-container">
              <div className={'small-name-and-picture-container ' + (videoVisible ? 'hidden' : '')}>
                {this.state.profilePictureURL ? (
                  <div className="picture-container">
                    <img src={this.state.profilePictureURL} alt={this.props.name} />
                  </div>
                ) : null}
                <div className={this.state.profilePictureURL ? 'small-name-small' : 'small-name-big'}>{this.props.name}</div>
              </div>
            </div>
          )}
        </>
      );
    } else if (!this.props.isEnlarged) {
      let insideComponent;
      if (videoVisible) {
        insideComponent = (
          <div className="full-size">
            <video className={dimColor + ' ' + (videoVisible ? '' : 'hidden')} id={'video_' + this.props.id} muted></video>
          </div>
        );
      } else if (streamStatus !== '' || inCallStatus !== '' || this.props.onMobile) {
        insideComponent = (
          <>
            <div className="small-picture-and-icon-container">
              {this.state.profilePictureURL ? (
                <div className="picture-container small-picture">
                  <img src={this.state.profilePictureURL} alt={this.props.name} />
                </div>
              ) : null}
              <img src={infoIcon} className="small-icon" />
            </div>
            <div style={{fontSize: '12px', marginTop: '5px', marginBottom: '5px', fontStyle: 'italic'}}>{infoText}</div>
          </>
        );
      } else {
        if (this.state.profilePictureURL) {
          insideComponent = (
            <div className="picture-container">
              <img src={this.state.profilePictureURL} alt={this.props.name} />
            </div>
          );
        } else {
          insideComponent = null;
        }
      }

      videoComponent = (
        <div className="small-main-container">
          <div className="small-metadata-container">
            {textContent}
            <div></div>
            <div className={'status-container ' + colorClass}>
              <div>{this.state.messages.length == 0 ? '' : this.state.messages.length}</div>
            </div>
          </div>
          <div className={'small-name-and-picture-container'}>
            {insideComponent}
            <div className={this.state.profilePictureURL ? 'small-name-small' : 'small-name-big'}>{this.props.name}</div>
          </div>
        </div>
      );
    } else {
      if (videoVisible) {
        videoComponent = (
          <>
            <div className="full-size">
              <video className={dimColor + ' ' + (videoVisible ? '' : 'hidden')} id={'video_' + this.props.id} muted></video>
            </div>
            <div className={'status-container-border ' + backgroundColorClass}>
              <div className={'status-container ' + colorClass}>
                <div>{this.state.messages.length == 0 ? '' : this.state.messages.length}</div>
              </div>
            </div>
            {textContent}
            <div className={'text-on-large name-text ' + backgroundColorClass}>{this.props.name}</div>
          </>
        );
      } else {
        videoComponent = (
          <>
            <div className="full-size big-no-video-container">
              {this.state.profilePictureURL ? (
                <div className="picture-container big-picture">
                  <img src={this.state.profilePictureURL} alt={this.props.name} />
                </div>
              ) : null}
              <div className="big-info-container">
                <div className="info-name">{this.props.name}</div>
                <div style={{display: 'flex', marginBottom: '15px', alignItems: 'center'}}>
                  <img className="info-icon" src={infoIcon} />
                  <span className="info-text">{infoText}</span>
                </div>
                <div className="info-status-text">{textStatus}</div>
              </div>
            </div>
            <div className={'status-container-border ' + backgroundColorClass}>
              <div className={'status-container ' + colorClass}>
                <div>{this.state.messages.length == 0 ? '' : this.state.messages.length}</div>
              </div>
            </div>
          </>
        );
      }
    }

    let smallClass = this.props.isEnlarged ? 'big-video-container' : 'small-video-container';
    let menuClass = this.state.videoMenu ? 'in-menu-video-container' : '';

    return (
      <div
        className={'video-container' + ' ' + smallClass + ' ' + backgroundColorClass + ' ' + menuClass}
        data-id={this.props.id}
        id={'video_container_' + this.props.id}
        onMouseDown={this.onTouchVideoDown.bind(this)}
        onMouseUp={this.onTouchVideoUp.bind(this)}
        onTouchStart={this.onTouchVideoDown.bind(this)}
        onTouchEnd={this.onTouchVideoUp.bind(this)}>
        { this.state.videoMenu ?
          <VideoMenu
            id={this.props.id}
            ownId={this.props.ownId}
            closeMenu={this.closeMenu.bind(this)}
            messages={this.state.messages}
            name={this.props.name}
          /> : videoComponent
        }
      </div>
    );
  }
}

export default Video;
