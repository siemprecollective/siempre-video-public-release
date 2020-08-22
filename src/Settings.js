import React from 'react';
import { auth, db, storage } from './constants.js';
import { localPreferences } from './LocalPreferences.js';
import './Settings.css';

import Walkthrough from './Walkthrough.js';

class Settings extends React.Component {
  outQualityOpts = [
    "1280x720",
    "640x480",
    "320x240",
    "160x120",
    "80x60",
  ];

  constructor(props) {
    super(props);
    this.outQualityHandle = localPreferences.on("outQuality", (value) => {
      this.setState({outQuality: value});
    });
    this.state = {
      outQuality: localPreferences.get("outQuality"),
      errorMessage: null,
      successMessage: null,
      profilePictureURL: "",
      showWalkthrough: false,
    };
  }

  componentWillUnmount() {
    localPreferences.remove("outQuality", this.outQualityHandle);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.profilePicturePath !== this.props.profilePicturePath) {
      storage.ref().child(this.props.profilePicturePath).getDownloadURL().then((url) => {
        this.setState({ profilePictureURL : url });
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  uploadProfilePicture() {
    let profilePicture = document.querySelector("#profile-picture").files[0];
    let profilePicturePath = `${this.props.id}/profile`;
    let profilePictureRef = storage.ref().child(profilePicturePath);
    profilePictureRef.put(profilePicture);

    db.collection("users").doc(this.props.id).update({
      profilePicturePath: profilePicturePath
    }).then((temp) => {
      this.setSuccessMessage("Successfully updated profile picture.");
    }).catch((err) => {
      this.setErrorMessage();
    });
  }

  updateName(e) {
    e.preventDefault();
    let newName = document.querySelector("#name").value;
    db.collection("users").doc(this.props.id).update({
      name: newName
    }).then((temp) => {
      this.setSuccessMessage("Successfully updated name.");
    }).catch((err) => {
      this.setErrorMessage();
    });
  }

  updateEmail(e) {
    e.preventDefault();
    let newEmail = document.querySelector("#email").value;
    if (auth.currentUser) {
      auth.currentUser.updateEmail(newEmail)
        .then(() => {
          this.setSuccessMessage("Successfully updated email.");
        }).catch((err) => {
          this.setErrorMessage();
        });
    } else {
      this.setErrorMessage();
    }
  }

  updatePassword(e) {
    e.preventDefault();
    let newPassword = document.querySelector("#password").value;
    if (auth.currentUser) {
      auth.currentUser.updatePassword(newPassword)
        .then(() => {
          this.setSuccessMessage("Successfully set new password.");
        }).catch((err) => {
          if (newPassword.length < 6) {
            this.setState({ errorMessage: "Password must be 6 characters long or more."});
          } else {
            this.setErrorMessage();
          }
        });
    } else {
      this.setErrorMessage();
    }
  }

  signOut() {
    localPreferences.set('optimisticLogIn', false);
    auth.signOut().then(() => {
      window.location.reload();
    }, (error) => {
      console.log("sign out error", error);
    });
  }

  changeOutQuality() {
    let quality = document.querySelector("#outQuality").selectedOptions[0].getAttribute("name");
    let width = quality.split("x")[0];
    let height = quality.split("x")[1];
    localPreferences.set("outQuality", {width: width, height: height});
  }

  setSuccessMessage(message) {
    this.setState({
      errorMessage: null,
      successMessage: message
    });
    setTimeout(() => this.setState({successMessage: null}), 3000);
  }

  setErrorMessage() {
    this.setState({ errorMessage: "An error occurred. Please refresh the page and try again."});
  }

  render() {
    let firstCharName = '';
    if (this.props.name && this.props.name.length > 0) {
      firstCharName = this.props.name.charAt(0).toUpperCase();
    }
    let outQualityStr = `${this.state.outQuality.width}x${this.state.outQuality.height}`;

    let content;
    if (this.state.showWalkthrough) {
      content = (
        <div style={{paddingTop: "100px"}} >
        <Walkthrough
          finished={() => {this.setState({ showWalkthrough: false})}}
          setSuccessMessage={this.setSuccessMessage.bind(this)}
          setErrorMessage={this.setErrorMessage.bind(this)}
        />
        </div>
      );
    } else {
      content = (
        <div id="centerHolder">
          <div className="settingsSection">
            <div className="profile-picture">
              { this.state.profilePictureURL ?
                <img src={this.state.profilePictureURL} alt="you" />
              :
                <span>{ firstCharName }</span>
              }
            </div>
            <form>
              <input type="file" id="profile-picture" style={{"display": "none"}} onChange={this.uploadProfilePicture.bind(this)} />
            </form>
            <button onClick={() => {document.querySelector("#profile-picture").click();}}>
            Change Profile Picture
            </button>
          </div>

          <div className="settingsSection">
            <div>
            Name: <b>{this.props.name}</b>
            </div>
            <div>
            Email: <b>{auth.currentUser.email}</b>
            </div>
          </div>

          <div className="settingsSection">
            <form>
              <input type="text" id="name" />
              <button type="submit" onClick={this.updateName.bind(this)}>Change Name</button>
            </form>

            <form>
              <input type="text" id="email" />
              <button type="submit" onClick={this.updateEmail.bind(this)}>Change Email</button>
            </form>

            <form>
              <input type="password" id="password" />
              <button type="submit" onClick={this.updatePassword.bind(this)}>Change Password</button>
            </form>
          </div>

          <div className="settingsSection">
            <b>Outgoing camera stream quality </b>
            <select id="outQuality" onChange={this.changeOutQuality.bind(this)}>
            {this.outQualityOpts.map((quality) => {
              let height = quality.split("x")[1];
              return (<option key={quality} name={quality} selected={quality === outQualityStr}>{height}p</option>);
            })}
            </select>
          </div>

          <div className="settingsSection">
            <button onClick={() => { this.setState({ showWalkthrough: true}) }} >Walkthrough</button>
          </div>

          <div className="settingsSection">
            <b>Sign Out</b>
            <form>
            <button onClick={this.signOut.bind(this)}>sign out</button>
            </form>
          </div>
        </div>
      )
    }

    return(
      <div className={this.props.display ? '' : 'no-display'}>
        {
          this.state.errorMessage ?
            <div className="bottomMessage" id="errorMessage">
              {this.state.errorMessage}
            </div> : null
        }

        {
          this.state.successMessage ?
            <div className="bottomMessage" id="successMessage">
              {this.state.successMessage}
            </div> : null
        }

        { content }
      </div>
    );
  }
}

export default Settings;
