import {StreamManager, SignalingServerConnection} from 'siemprevideo-streamlib';
import CallManager from './CallManager.js';

import { LogglyTracker } from 'loggly-jslogger';
import firebase from 'firebase';

require("firebase/firestore");

var firebaseConfig = {
  apiKey: "BLANK",
  authDomain: "BLANK",
  databaseURL: "BLANK",
  projectId: "BLANK",
  storageBucket: "BLANK",
  messagingSenderId: "BLANK",
  appId: "BLANK"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const timestamp = firebase.firestore.Timestamp;

const logger = new LogglyTracker();
logger.push({ 'logglyKey': 'BLANK'});

const wrtc = {
  mediaDevices: navigator.mediaDevices,
  RTCPeerConnection: RTCPeerConnection,
  RTCIceCandidate: RTCIceCandidate,
  RTCSessionDescription: RTCSessionDescription,
};
const signaling = new SignalingServerConnection(auth);
const streamManager = new StreamManager(wrtc);
window.streamManager = streamManager // for debug
const callManager = new CallManager();

const pixelDragThreshold = 20;
const msHoldThreshold = 1000;

export {db, auth, storage, timestamp, logger, streamManager, callManager, signaling, pixelDragThreshold, msHoldThreshold};
