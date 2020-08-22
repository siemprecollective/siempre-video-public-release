import React from 'react';
import './Home.css';
import './fonts.css';
import Logo from "./res/Logo.png";
import LinuxLogo from "./res/linux.png";
import AppleLogo from "./res/apple.png";
import WindowsLogo from "./res/windows.png";
import ChromeLogo from "./res/chrome.png";

import { auth, db, storage } from './constants.js';

import { localPreferences } from './LocalPreferences.js';

import LoadingScreen from './LoadingScreen.js';
import Walkthrough from './Walkthrough.js';

class Home extends React.Component {
  constructor(props) {
    super(props);

    var optimisticLogIn = localPreferences.get('optimisticLogIn');

    this.state = {
      name: "",
      loading: optimisticLogIn,
      pageToLoad: 'Intro',
      isRegister: false,
      errorMessage: null,
      successMessage: null,
    };

    if (optimisticLogIn) {
      setTimeout(() => {
        if (this._isMounted) {
          this.setState({ loading: false });
        }
      }, 2000);
    }
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  componentDidMount() {
    this._isMounted = true
    auth.onAuthStateChanged((user) => {
      if (user) {
        db.collection("users").doc(user.uid).get()
          .then((doc) => {
            if (!doc.exists) {
              let newUserObj = {
                friends: {},
                inCall: {},
                name: this.state.name,
                status: 2,
                pluggedIn: {},
                walkthroughCompleted: false
              };
              db.collection("users").doc(user.uid).set(newUserObj)
                .then(() => {
                  localPreferences.set('optimisticLogIn', true);
                })
            } else {
              localPreferences.set('optimisticLogIn', true);
            }
            if (!user.emailVerified) {
              this.setState({ pageToLoad: "WaitForVerification" });
            } else if (!doc.data().walkthroughCompleted && doc.data().walkthroughCompleted !== undefined) {
              this.setState({ "pageToLoad": "Walkthrough" });
            } else {
              this.props.updateId(user.uid);
            }
          })
      }
    })
  }

  setSuccessMessage(message) {
    this.setState({
      errorMessage: null,
      successMessage: message
    });
    setTimeout(() => this.setState({ successMessage: null }), 3000);
  }

  setErrorMessage(message) {
    this.setState({
      errorMessage: message,
      successMessage: null
    });
    setTimeout(() => this.setState({ errorMessage: null }), 3000);
  }

  loginAccount() {
    auth.signInWithEmailAndPassword(document.querySelector("#email").value.trim(), document.querySelector("#password").value).catch((err) => {
      console.log(err.code, err.message);
      this.setErrorMessage(err.message);
    })
  }

  registerAccount() {
    // Then we need to create the user document
    auth.createUserWithEmailAndPassword(
      document.querySelector("#registration-email").value.trim(),
      document.querySelector("#registration-password").value
    ).then(() => {
      return auth.currentUser.sendEmailVerification()
    }).then(() => {
      this.setState({ pageToLoad: "WaitForVerification" });
    }).catch((err) => {
      console.log(err.code, err.message);
      this.setErrorMessage(err.message);
    })
  }

  resetPassword() {
    let email = document.querySelector('#email').value;
    auth.sendPasswordResetEmail(email).then(() => {
      this.setSuccessMessage("Reset password email successfully sent");
    }).catch((error) => {
      this.setErrorMessage(error.message);
    });
  }

  checkIfVerified() {
    auth.currentUser.reload().then(() => {
      if (auth.currentUser.emailVerified) {
        this.setState({ pageToLoad: "Walkthrough" });
      }
    })
  }

  onNameChange() {
    this.setState({
      name: document.getElementById("registration-name").value,
    });
  }

  render() {
    if (this.state.loading) {
      return <LoadingScreen />
    }

    var body;
    var spacer;

    //Back to Home
    var backToHome = (
      <p id="backHome" onClick={() => { this.setState({ pageToLoad: 'Intro' }); this.setState({ walkthroughPage: 0 }); }}>Back to Home</p>
    );


    //Intro + Downloads
    if (this.state.pageToLoad === 'Intro') {
      body = (
        <div id="intro" style={{ display: "table", margin: "26px auto 20px auto", textAlign: "center" }}>
          <div style={{ float: "left", width: "400px", margin: "0px 0px 0px 0px" }}>
            <div style={{ display: "table", width: "150px", margin: "32px auto 42px auto" }}>
              <button onClick={() => this.setState({ pageToLoad: 'Registration' })} style={{ height: "26px", width: "132px", marginTop: "4px" }}>Create Account</button>
              <button onClick={() => this.setState({ pageToLoad: 'Login' })} style={{ height: "26px", width: "132px", marginTop: "6px" }}>Sign In</button>
            </div>
          </div>
        </div>
      );
    }//Login
    else if (this.state.pageToLoad === 'Login') {
      body = (
        <div style={{ textAlign: "center", marginTop: "30px" }}>

          <div style={{ margin: "auto", width: "200px" }}>
            {backToHome}
            <p style={{ lineHeight: "22px", marginBottom: "20px" }}>Welcome back.</p>
          </div>

          <div id="login">
            <div style={{ float: "left", width: "66px", margin: "0px 0px 0px 0px" }}>
              <p style={{ float: "right" }}>Email:</p>
              <p style={{ float: "right" }}>Password:</p>
            </div>
            <div id="id_submit" style={{ width: "50px", float: "right" }}>
              <input type="text" id="email" />
              <input type="password" id="password" />
              <div style={{ width: "144px", marginTop: "0px", fontSize: "12px" }}>
                <p style={{ textAlign: "left" }} onClick={() => this.setState({ pageToLoad: 'PasswordReset' })}><span>Forgot Password?</span></p>
              </div>
            </div>
          </div>
          <div style={{ margin: "10px auto 0px", width: "200px" }}>
            <button style={{ height: "24px", width: "80px", marginTop: "4px" }} onClick={this.loginAccount.bind(this)} >Sign In</button>
          </div>
        </div>
      );
    } //Registration
    else if (this.state.pageToLoad === 'Registration') {
      body = (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <div style={{ margin: "auto", width: "200px" }}>
            {backToHome}
            <p style={{ lineHeight: "22px", marginBottom: "40px" }}>To create your account, please fill in the following:</p>
          </div>
          <div id="login">
            <div style={{ float: "left", width: "107px" }}>
              <p style={{ float: "right" }}>First Name:</p>
              <p style={{ float: "right" }}>Email:</p>
              <div style={{ width: "150px", height: "68px", float: "right" }}></div>
              <p style={{ float: "right" }}>Password:</p>
            </div>
            <div id="registration" style={{ width: "50px", float: "right" }}>
              <input type="text" id="registration-name" onChange={this.onNameChange.bind(this)} />
              <input type="text" id="registration-email" />
              <p style={{ fontSize: "12px", width: "220px", height: "58px", lineHeight: "15px", textAlign: "left" }}>We only use your email to help you manage your experience</p>
              <input type="password" id="registration-password" />
              <p style={{ fontSize: "12px", width: "220px", height: "28px", lineHeight: "15px", textAlign: "left" }}>Please use a <a href="https://support.mozilla.org/en-US/kb/create-secure-passwords-keep-your-identity-safe">secure</a> password</p>
            </div>
          </div>
          <div style={{ margin: "auto", width: "200px" }}>
            <button style={{ height: "24px", width: "140px", marginTop: "12px" }} onClick={this.registerAccount.bind(this)} >Create Account</button>
          </div>
        </div>
      );
    } //Password Reset
    else if (this.state.pageToLoad === 'PasswordReset') {
      body = (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <div style={{ margin: "auto", width: "200px" }}>
            {backToHome}
            <p style={{ lineHeight: "22px" }}>To reset your email, please type it below and click reset:</p>
          </div>
          <div id="login">
            <div style={{ float: "left", width: "66px", margin: "0px 0px 0px 0px" }}>
              <p style={{ float: "right" }}>Email:</p>
            </div>
            <div id="id_submit" style={{ width: "50px", float: "right" }}>
              <input type="text" id="email" />
              <button onClick={this.resetPassword.bind(this)} style={{ height: "24px", width: "128px", marginTop: "12px" }}>Reset Password</button>
            </div>
          </div>
        </div>
      );
    } //Waiting for account verification
    else if (this.state.pageToLoad === 'WaitForVerification') {
      body = (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <div style={{ margin: "auto", width: "256px" }}>
            {backToHome}
            <p style={{ lineHeight: "22px", marginBottom: "10px" }}>We’ve sent you an email to verify your account.</p>
            <p style={{ lineHeight: "22px", marginBottom: "10px" }}>Please refresh this page once you’ve processed our email.</p>
          </div>
          <button onClick={this.checkIfVerified.bind(this)} style={{ height: "24px", width: "100px", marginTop: "20px" }}>Refresh</button>
        </div>
      );
    } //Walkthrough pages
    else if (this.state.pageToLoad === 'Walkthrough') {
      body = (
        <Walkthrough
          setSuccessMessage={this.setSuccessMessage.bind(this)}
          setErrorMessage={this.setErrorMessage.bind(this)}
          finished={() => { this.props.updateId(auth.currentUser.uid) }}
        />
      );
    }
    else {
      body = (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <div style={{ margin: "auto", width: "256px" }}>
            {backToHome}
          </div>
        </div>
      );
    }


    spacer = (
      <div style={{ height: "50px" }}>
      </div>
    );


    let messages = (
      <>
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
      </>
    );

    return (
      <div>
        {messages}
        {body}
        {spacer}
      </div>
    );
  }
}

export default Home;
