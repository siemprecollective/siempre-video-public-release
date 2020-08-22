import React from 'react';

import { db, auth } from './constants.js';

import './FriendRequests.css';

export default class FriendRequests extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      friendRequests: {},
    }
  }

  onFriendRequestChange(query) {
      query.docChanges().forEach((change) => {
        let doc = change.doc;
        if (change.type === "removed") {
          this.setState((prevState) => {
            delete prevState.friendRequests[doc.id];
            return prevState;
          });
        } else {
          this.setState((prevState) => {
            prevState.friendRequests[doc.id] = doc.data();
            return prevState;
          });
        }
      });
  }

  componentDidMount() {
    this.friendRequestIdUnsubscribe = db
      .collection("friend-requests")
      .where("toId", "==", auth.currentUser.uid)
      .onSnapshot(this.onFriendRequestChange.bind(this));
    this.friendRequestEmailUnsubscribe = db
      .collection("friend-requests")
      .where("toEmail", "==", auth.currentUser.email)
      .onSnapshot(this.onFriendRequestChange.bind(this));
  }

  componentWillUnmount() {
    this.friendRequestIdUnsubscribe();
    this.friendRequestEmailUnsubscribe();
  }

  acceptRequest(friendId) {
    db.collection("friend-requests").doc().set({
      "fromId": auth.currentUser.uid,
      "toId": friendId
    });
  }

  rejectRequest(requestId) {
    db.collection("friend-requests").doc(requestId).delete();
  }

  render() {
    if (Object.keys(this.state.friendRequests).length <= 0) {
        return (<div></div>);
    }
    return (
      <div className="friend-requests-container">
        <p className="friend-requests-header">You've received some friend requests!</p>
        <div>
          {Object.keys(this.state.friendRequests).map((id) => {
            let friendRequest = this.state.friendRequests[id]
            return (
              <div key={id} className="friend-request-container">
                <button
                  onClick={this.acceptRequest.bind(this, friendRequest.fromId)}
                >Accept</button>
                <button 
                  onClick={this.rejectRequest.bind(this, id)}
                >Reject</button>

                <div>
                  <p>{friendRequest.fromName}</p>
                  <p>{friendRequest.fromEmail}</p>
                </div>
              </div>
            );
          })
          }
        </div>
      </div>
    );
  }

}