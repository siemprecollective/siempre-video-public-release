import React from 'react';
import { db, auth } from './constants.js';

import './SendFriendRequest.css';

export default class SendFriendRequest extends React.Component {
  inviteByEmail(e) {
    e.preventDefault();
    let email = document.querySelector("#invitation-email").value;
    document.querySelector("#invitation-email").value = "";
    db.collection("friend-requests").doc().set({
      "fromId": auth.currentUser.uid,
      "toEmail": email
    }).then((temp) => {
      this.props.setSuccessMessage("Successfully sent friend request");
    }).catch((err) => {
      this.props.setErrorMessage("Unable to send friend request");
    });
  }

  render() {
    return (
      <div className="send-friend-request-container">
        <p>If you’d like to invite your friends by email, enter their emails here. We will only send each friend one email.</p>
        <p>If they already have an account, we'll send them a friend request.</p>

        <div className="send-friend-request">
          <div className="invitation">
            <input type="text" id="invitation-email" />
          </div>
          <div className="invitation-button">
            <button onClick={this.inviteByEmail.bind(this)}>Invite by Email</button>
          </div>
        </div>
      </div>
    )
  }
}
