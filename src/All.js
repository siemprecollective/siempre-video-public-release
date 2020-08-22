import React from 'react'
import FriendBubble from './FriendBubble.js';
import { db } from './constants.js';

import './All.css';
import SendFriendRequest from './SendFriendRequest.js';
import FriendRequests from './FriendRequests.js';

class All extends React.Component {
  togglePlugged(id) {
    let updateObj = {};
    updateObj['pluggedIn.' + id] = !this.props.pluggedIn[id];
    db.collection('users').doc(this.props.id).update(updateObj);
  }

  render() {
    let friendComponents = [];
    Object.keys(this.props.friends)
      .sort((id1, id2) => this.props.friends[id1].name < this.props.friends[id2].name ? -1 : 1)
      .forEach(key => {
      friendComponents.push(
        <FriendBubble
          key={key}
          id={key}
          name={this.props.friends[key].name}
          plugged={this.props.pluggedIn[key]}
          profilePicturePath={this.props.friends[key].profilePicturePath}
          togglePlug={this.togglePlugged.bind(this)}
        />
      );
    })

    return (
      <div className={"all-friends-container "+(this.props.display? '' : 'no-display')}>
        <div className={"add-friends"}>
          <SendFriendRequest
            setSuccessMessage = {() => {}} 
            setErrorMessage = {() => {}} 
           />
          <FriendRequests />
        </div>
        <div className={"friend-bubble-scroll"}>
          <div className={"friend-bubble-container"} >
            { friendComponents }
          </div>
        </div>
      </div>
    )
  }
}

export default All;
