import React from 'react';
import MicWhite from "./res/mic-white.svg";
import MicBlack from "./res/mic-black.svg"
import VideoWhite from  "./res/video-white.svg";
import VideoBlack from  "./res/video-black.svg";
import PlayWhite from "./res/play-white.svg";
import PlayBlack from "./res/play-black.svg";
import BackWhite from "./res/back-white.png";
import BackBlack from "./res/back-black.png";
import SkipWhite from "./res/skip-white.svg";
import MusicWhite from "./res/music-white.svg";
import MusicBlack from "./res/music-black.svg";
import * as ebml from 'ts-ebml';

import "./VideoMenu.css";

import { getConversationId, generateId, isNightMode } from './utils.js';
import { db, storage, timestamp, streamManager } from './constants.js';

class VideoMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: "menu",
      currentMessageIndex: 0
    };
  }

  componentDidUpdate() {
    if (this.state.currentPage === "videoRecording") {
      this.updateRecordingVideo();
    }
  }

  updateRecordingVideo() {
    // TODO: this uses a private member of streamManager
    if (!streamManager._streamOut) {
      return;
    }
    let video = document.getElementById('recordVideo');
    if (video === null) {
      return;
    }

    video.muted = true;
    video.srcObject = streamManager._streamOut;
    video.play();
  }

  readAsArrayBuffer(blob) {
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onloadend = ()=>{ resolve(reader.result); };
      reader.onerror = (ev)=>{ reject(ev.error); };
    });
  }

  // type is "audio" or "video"
  startRecording(type) {
    console.log("start recording");
    this.setState({ currentPage: type + "Recording" });
    navigator.mediaDevices.getUserMedia({ audio: true, video: (type === "video") })
      .then(stream => {
        const decoder = new ebml.Decoder();
        const reader = new ebml.Reader();
        reader.logging = false;
        reader.drop_default_duration = false;

        const mimeType = (type === 'audio' ? 'audio/webm' : 'video/webm; codecs="vp8, opus"');
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
        this.mediaRecorder.start();

        let tasks = Promise.resolve(); // tasks will be a chain of ebml tasks
        const dataChunks = [];
        this.mediaRecorder.addEventListener("dataavailable", event => {
          const chunk = event.data;
          dataChunks.push(chunk);
        });

        this.mediaRecorder.addEventListener("stop", () => {
          const messageBlob = new Blob(dataChunks, {type: mimeType});
          this.readAsArrayBuffer(messageBlob).then(buffer => {
            const elms = decoder.decode(buffer);
            elms.forEach((elm) => { reader.read(elm); });
            reader.stop();

            var refinedMetadataBuf = ebml.tools.makeMetadataSeekable(
                reader.metadatas, reader.duration, reader.cues);
            var body = buffer.slice(reader.metadataSize);

            const refinedBlob = new Blob([refinedMetadataBuf, body],
              {type: messageBlob.type});

            let messageId = generateId(20);
            let storagePath = 'messages/' + messageId + '.webm';
            let messageRef = storage.ref().child(storagePath);
            messageRef.put(refinedBlob).then((snapshot) => {
              console.log("Successfully loaded blob!");
              let conversationId = getConversationId(this.props.id, this.props.ownId);
              db.collection("conversations").doc(conversationId).get()
                .then((doc) => {
                  if (doc.exists) {
                    db.collection("conversations").doc(conversationId).collection("messages").doc(messageId).set({
                      from: this.props.ownId,
                      to: this.props.id,
                      time: timestamp.now(),
                      path: storagePath,
                      seen: false,
                      type: type
                    })
                    .catch((err) => console.log("error setting document: " + err))
                  } else {
                    let usersMap = {
                      [this.props.ownId]: true,
                      [this.props.id]: true
                    };
                    db.collection("conversations").doc(conversationId).set({
                      users: usersMap
                    })
                    .then(() => {
                      db.collection("conversations").doc(conversationId).collection("messages").doc(messageId).set({
                        from: this.props.ownId,
                        to: this.props.id,
                        time: timestamp.now(),
                        path: storagePath,
                        seen: false,
                        type: type
                      })
                      .catch((err) => console.log("error setting document: " + err))
                    })
                    .catch((err) => console.log("error setting document: " + err))
                  }
                })
                .catch((err) => {
                  console.log("error getting document: " + err);
                })
            });
          });
        });

        this.limitTimeout = setTimeout(() => {
          this.stopRecording();
        }, 30000);
      });
  }

  stopRecording() {
    console.log("stop recording");
    this.setState({ currentPage: "sent" });
    if (this.mediaRecorder) {
      clearTimeout(this.limitTimeout);
      this.mediaRecorder.stop();
    }

    setTimeout(() => {
      this.props.closeMenu();
    }, 2000)
  }

  // We play from the messages array, starting from the end to the start
  playSingleMessage(url) {
    console.log("playSingleMessage url:", url);
    let audio_element = document.getElementById('voiceMessage');
    let video_element = document.getElementById('videoMessage');
    let audio_icon = document.getElementById('musicIcon');
    let message = this.props.messages[this.messageIndexSync];
    if (message.type === "audio") {
      video_element.classList.remove("video-show");
      video_element.classList.add("display-gone");
      audio_icon.classList.remove("display-gone");
      audio_element.src = url;
      audio_element.load();
      audio_element.play();
    } else {
      video_element.classList.add("video-show");
      video_element.classList.remove("display-gone");
      audio_icon.classList.add("display-gone");
      video_element.src = url;
      video_element.load();
      video_element.play();
    }
  }

  playNextMessage() {
    console.log("called playNextMessage");
    if (this.values.length > 0) {
      this.setState({ currentMessageIndex: this.state.currentMessageIndex + 1 });
      this.messageIndexSync += 1;
      this.playSingleMessage(this.values.pop());
    } else {
      console.log("reached end, calling close menu");
      this.props.messages.forEach(message => {
        db.collection("conversations").doc(getConversationId(this.props.ownId, this.props.id)).collection("messages").doc(message.id).update({ seen: true })
      });
      this.props.closeMenu();
    }
  }

  playMessages() {
    if (this.props.messages.length > 0) {
      this.setState({
        currentPage: "playing",
        currentMessageIndex: 0
      });
      this.messageIndexSync = 0;
      let fetchURLs = [];
      let audio_element = document.getElementById('voiceMessage');
      let video_element = document.getElementById('videoMessage');
      audio_element.addEventListener("ended", () => {
        console.log("audio ended event listener");
        this.playNextMessage();
      });
      video_element.addEventListener("ended", () => {
        console.log("video ended event listener");
        this.playNextMessage();
      });

      console.log("getting all the download URL tasks");
      this.props.messages.forEach(message => {
        let audioRef = storage.ref().child(message.path);
        fetchURLs.push(audioRef.getDownloadURL());
      });
      Promise.all(fetchURLs).then(values => {
        console.log("got the URLs ", values);
        this.values = values.reverse();
        this.playSingleMessage(this.values.pop());
      }).catch(err => {
        console.log("error getting download URLS ", err);
      });
    }
  }

  skipMessage() {
    let audio_element = document.getElementById('voiceMessage');
    let video_element = document.getElementById('videoMessage');
    audio_element.pause();
    video_element.pause();
    this.playNextMessage();
  }

  exitPlayMessage() {
    for (var index = 0; index < this.state.currentMessageIndex; index++) {
      db.collection("conversations").doc(getConversationId(this.props.ownId, this.props.id)).collection("messages").doc(this.props.messages[index].id).update({ seen: true })
    }

    let audio_element = document.getElementById('voiceMessage');
    let video_element = document.getElementById('videoMessage');
    audio_element.pause();
    video_element.pause();
    this.props.closeMenu();
  }

  render() {
    let mainComponent;
    if (this.state.currentPage === "playing") {
      mainComponent = (
        <>
          <div className="playing-bottom-bar">{(this.state.currentMessageIndex + 1) + " / " + this.props.messages.length}</div>
          <img src={BackWhite} className="playing-icon playing-stop-icon" onClick={this.exitPlayMessage.bind(this)}/>
          <img src={SkipWhite} className="playing-icon playing-skip-icon" onClick={this.skipMessage.bind(this)}/>
          <img id="musicIcon" src={isNightMode() ? MusicWhite : MusicBlack} className="music-icon display-gone" />
        </>
      );
    } else if (this.state.currentPage === "sent") {
      mainComponent = (
        <div className="menu-container fill-space">
          <div className="sent-text">Sent!</div>
        </div>
      );
    } else if (this.state.currentPage === "audioRecording") {
      mainComponent = (
        <div className="menu-container fill-space">
          <div className="stop-button-container" onClick={this.stopRecording.bind(this)}>
            <div className="stop-button-content">
            </div>
          </div>
        </div>
      );
    } else if (this.state.currentPage === "videoRecording") {
      mainComponent = (
        <div className="menu-container fill-space">
          <video id="recordVideo" />
          <div className="video-stop-button" onClick={this.stopRecording.bind(this)}>
            <div className="video-stop-content" />
          </div>
        </div>
      );
    } else {
      mainComponent = (
        <div className="menu-container fill-space">
          <div className="menu-container-row first-row">
            <div onClick={this.props.closeMenu}>
              <img src={isNightMode() ? BackWhite : BackBlack} className="menu-icon" />
            </div>
            <div className="menu-name">{this.props.name}</div>
          </div>
          <div className="menu-container-row">
            <div
              className={this.props.messages.length === 0 ? "unselected" : "selected"}
              onClick={this.playMessages.bind(this)}
            >
              <img src={isNightMode() ? PlayWhite : PlayBlack} className="menu-icon" />
              { this.props.messages.length > 0 ?
                <div id="menu-number-container">{this.props.messages.length}</div>
              :
                null
              }
            </div>
            <div onClick={() => this.startRecording("audio")}>
              <img src={isNightMode() ? MicWhite : MicBlack} className="menu-icon" />
            </div>
            <div onClick={() => this.startRecording("video")}>
              <img src={isNightMode() ? VideoWhite : VideoBlack} className="menu-icon" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fill-space">
        { mainComponent }
        <audio id="voiceMessage" />
        <video id="videoMessage" className="display-gone"/>
      </div>
    )
  }
}

export default VideoMenu
