import React from 'react'
import './FriendBubble.css';

import { storage } from './constants.js';

class FriendBubble extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      profilePictureURL: ""
    };
  }

  componentDidMount() {
    if (this.props.profilePicturePath) {
      storage.ref().child(this.props.profilePicturePath).getDownloadURL().then((url) => {
        this.setState({ profilePictureURL: url });
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  render() {
    let firstCharName = '';
    if (this.props.name && this.props.name.length > 0) {
      firstCharName = this.props.name.charAt(0).toUpperCase();
    }

    return (
      <div className="friend-bubble">
        <div className={"friend-bubble-picture" + (this.props.plugged ? ' friend-bubble-picture-selected' : '')} onClick={() => this.props.togglePlug(this.props.id)}>
          { this.state.profilePictureURL === "" ?
            <div>{ firstCharName }</div>
          :
            <img src={this.state.profilePictureURL} alt={this.props.name} />
          }
        </div>
        <div className={"friend-bubble-name" + (this.props.plugged ? ' friend-bubble-selected' : '')}>
        { this.props.name }
        </div>
      </div>
    );
  }
}

export default FriendBubble;
