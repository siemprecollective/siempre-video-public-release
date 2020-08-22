import React from 'react';

import WalkthroughPhoto_1  from "./res/Slide1.PNG";
import WalkthroughPhoto_2  from "./res/Slide2.PNG";
import WalkthroughPhoto_3  from "./res/Slide3.PNG";
import WalkthroughPhoto_4  from "./res/Slide4.PNG";
import WalkthroughPhoto_5  from "./res/Slide5.PNG";
import WalkthroughPhoto_6  from "./res/Slide6.PNG";
import WalkthroughPhoto_7  from "./res/Slide7.PNG";
import WalkthroughPhoto_8  from "./res/Slide8.PNG";
import WalkthroughPhoto_9  from "./res/Slide8.PNG";
import WalkthroughPhoto_10 from "./res/Slide9.PNG";
import WalkthroughPhoto_11 from "./res/Slide10.PNG";
import WalkthroughPhoto_12 from "./res/Slide11.PNG";
import WalkthroughPhoto_13 from "./res/Slide12.PNG";
import WalkthroughPhoto_14 from "./res/Slide13.PNG";
import WalkthroughPhoto_15 from "./res/Slide14.PNG";
import WalkthroughPhoto_16 from "./res/Slide15.PNG";
import WalkthroughPhoto_17 from "./res/Slide16.PNG";
import WalkthroughPhoto_18 from "./res/Slide17.PNG";
import WalkthroughPhoto_19 from "./res/Slide18.PNG";

import PhotoUpload from "./res/Photo Upload.png";

import FriendRequests from './FriendRequests.js';
import SendFriendRequest from './SendFriendRequest.js';

import { auth, db, storage } from './constants.js';

class Walkthrough extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walkthroughPage: 0
        }
    }

    uploadProfilePicture() {
        let profilePicture = document.querySelector("#profile-picture").files[0];
        let profilePicturePath = `${auth.currentUser.uid}/profile`;
        let profilePictureRef = storage.ref().child(profilePicturePath);

        profilePictureRef.put(profilePicture).then(() => {
            return db.collection("users").doc(auth.currentUser.uid).update({
                profilePicturePath: profilePicturePath
            });
        }).then(() => {
            return storage.ref().child(profilePicturePath).getDownloadURL().then((url) => {
                this.setState({ profilePictureURL: url });
            });
        }).then(() => {
            this.props.setSuccessMessage("Successfully updated profile picture.");
        }).catch((err) => {
            this.props.setErrorMessage(err);
        });
    }

    walkthroughNext() {
        if (this.state.walkthroughPage === 22) {
            //needs_wiring
            db.collection("users").doc(auth.currentUser.uid).update({
                walkthroughCompleted: true,
            })
            this.props.finished();
        }
        else {
            this.setState({ walkthroughPage: this.state.walkthroughPage + 1 })
        }
    }

    walkthroughBack() {
        if (this.state.walkthroughPage > 0) {
            this.setState({ walkthroughPage: this.state.walkthroughPage - 1 })
        }
    }

    inviteByEmail() {

    }

    render() {
        var walkthroughContents;
        var walkthroughNav;

        //These are the actual pages for the walkthrough

        // overview of the walkthrough
        if (this.state.walkthroughPage === 0) {
            walkthroughContents = (
                <div style={{ margin: "50px auto 0px auto", textAlign: "left", width: "260px", minHeight: "270px" }}>
                    <h3>Welcome.</h3>
                    <p className="walkthrough-explanation">This walkthrough includes:</p>
                    <ul>
                        <li>Inviting your friends</li>
                        <li>Uploading profile picture</li>
                        <li>Learning how the app works</li>
                    </ul>
                    <p className="walkthrough-explanation">All of this information is also available from the settings page</p>
                </div>
            );
        } //review any pending friend requests + invite your friends
        else if (this.state.walkthroughPage === 1) {
            walkthroughContents = (
                <div style={{ margin: "50px auto 0px auto", textAlign: "left", width: "332px", minHeight: "270px" }}>
                    <FriendRequests />
                    <SendFriendRequest
                        setSuccessMessage={this.props.setSuccessMessage}
                        setErrorMessage={this.props.setErrorMessage}
                    />
                 </div>
            );
        } //upload your photo
        else if (this.state.walkthroughPage === 2) {
            walkthroughContents = (
                <div style={{ margin: "50px auto 0px auto", textAlign: "center", width: "200px", minHeight: "270px" }}>
                    <div id="photoUpload" style={{ width: "100px", height: "100px", backgroundColor: "#d9d9d9", borderRadius: "50px", margin: "auto" }} onClick={() => { document.querySelector("#profile-picture").click() }}>
                        <input type="file" id="profile-picture" style={{ display: "none" }} onChange={() => { this.uploadProfilePicture() }} />
                        <img src={this.state.profilePictureURL ? this.state.profilePictureURL : PhotoUpload} alt="" style={{ width: "100px", height: "100px", padding: "10px" }} />
                    </div>
                    <p className="walkthrough-explanation">Uploading a profile picture helps your friends recognize you</p>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 3) {
            walkthroughContents = (
                <div style={{ margin: "100px auto 0px auto", textAlign: "center", width: "300px", minHeight: "270px" }}>
                    <p className="walkthrough-explanation">Now we'll begin the walkthrough!</p>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 4) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "250px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <p style={{ display: "table-cell", verticalAlign: "middle" }}>The 'Commons' page is like your living room. If your friends are active, you’ll see them here.</p>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_1}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 5) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "250px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <p style={{ display: "table-cell", verticalAlign: "middle" }}>Everyone indicates their availability (or “status”) with a color.</p>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_2}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 6) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "250px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <p style={{ display: "table-cell", verticalAlign: "middle" }}>You can see what your status is by looking at the color around your video or name.</p>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_3}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 7) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "250px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">The same applies for the color around your friend’s names, pictures or videos.</p>
                            <p className="walkthrough-explanation">There are four different colors: <span style={{ fontWeight: "bold", color: "green" }}>green</span>, <span style={{ fontWeight: "bold", color: "red" }}>red</span>, <span style={{ fontWeight: "bold", color: "gray" }}>gray</span>, and <span style={{ fontWeight: "bold", color: "blue" }}>blue</span>.</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_4}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 8) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation"><span style={{ fontWeight: "bold", color: "green" }}>Green</span> means you or your friend are available.</p>
                            <p className="walkthrough-explanation">When you’re available, the friends that you’ve allowed into your common room (the people you see on this screen) can tap on your video and start talking to you without you having to accept anything.</p>
                            <p className="walkthrough-explanation">Same applies if your friends are <span style={{ fontWeight: "bold", color: "green" }}>green</span>!</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_5}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 9) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation"><span style={{ fontWeight: "bold", color: "red" }}>Red</span> means you’re busy.</p>
                            <p className="walkthrough-explanation">Your friends can still see you but nobody can start talking to you.</p>
                            <p className="walkthrough-explanation">If any of your friends are <span style={{ fontWeight: "bold", color: "green" }}>green</span>, you can still talk to them by tapping on their videos, even though you're busy.</p>
                            <p className="walkthrough-explanation">Marking yourself as busy is great for working without getting lonely.</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_6}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 10) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation"><span style={{ fontWeight: "bold", color: "gray" }}>Gray</span> means you or your friend is offline. Nobody can see or hear you. Nobody can start talking to you. The same is true if your friend is colored gray. You can’t see, hear or start talking to them.</p>
                            <p className="walkthrough-explanation">Everyone who is offline is bundled together on the side.</p>
                            <p className="walkthrough-explanation">This is so that you know who you’ve let into your space.</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_7}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 11) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation"><span style={{ fontWeight: "bold", color: "blue" }}>Blue</span> means you and a friend are in a call together.</p>
                            <p className="walkthrough-explanation">To prevent anyone else from interrupting your conversation, you’ll show up as busy to them in the meantime.</p>
                            <p className="walkthrough-explanation">You can also add other friends to the call as long as they’re friends with everyone else that is already in thecall!</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_8}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 12) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">Once you’re in a call, it’s just like a normal video call except you can still see all your other friends and they won’t be able to hear you or see who you’re talking to.</p>
                            <p className="walkthrough-explanation">You can leave the call just by tapping on one of the participant’s videos.</p>
                        </div>
                    </div>

                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_9}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 13) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">If you want to keep your videos private while you’re on a call, you’re a feature for that! Just drag someone from your call all the way to the right to move the conversation into the private room.</p>
                            <p className="walkthrough-explanation">You can add other people to the call later by swiping back into the commons area and dragging them in.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_10}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 14) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">You can change your status by selecting a new status color.</p>
                            <p className="walkthrough-explanation">There are also text statuses which you can type so that you can share brief quick update with everyone.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_11}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 15) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">You can also minimize or enlarge users’ videos by moving them back and forth between the small and large views.</p>
                            <p className="walkthrough-explanation">If your own video is in the way, you can drag it around side to side!</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_12}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 16) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">When you want to say something but your friend is offline or you don’t want to interrupt them, you can leave them a message.</p>
                            <p className="walkthrough-explanation">Do that, hold press on their video and then click the record icon.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_13}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 17) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">The message will send itself after 30 seconds or if you hit the stop button before that. There’s no way to replay it before you send and no way to edit your message.</p>
                            <p className="walkthrough-explanation">Once your friend receives your message, they can only listen to it once before it is deleted.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_14}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 18) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">If you get a message, there will be no notification. It's completely silent except for your friends talking to you!</p>
                            <p className="walkthrough-explanation">There will just be a small number indicator by that person’s rectangle. If you hold press on their video, you can click the play button and the message will start playing.</p>
                            <p className="walkthrough-explanation">Remember to pay attention though! It’ll only ever play once.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_15}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 19) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">The last feature helps you adjust which friends are in the common room.</p>
                            <p className="walkthrough-explanation">You can remove or add people whenever you want and they won’t know the difference between you being offline and you removing them from your room.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_16}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 20) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">To remove someone, you can just drag their video or rectangle all the way to the left to add them to the friends page.</p>
                            <p className="walkthrough-explanation">To add them back, you can go to the friends page and tap on their icon to re-enable them.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_17}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 21) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">Lastly, there’s the settings page.</p>
                            <p className="walkthrough-explanation">You can change your profile picture, name, email and send or accept friend requests from here.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_18}></img>
                </div>
            );
        }
        else if (this.state.walkthroughPage === 22) {
            walkthroughContents = (
                <div id="resizeWidth" style={{ margin: "50px auto 50px auto", textAlign: "center", display: "table" }}>
                    <div style={{ width: "350px", height: "200px", textAlign: "left", float: "left", verticalAlign: "middle", marginRight: "20px", display: "table" }}>
                        <div style={{ display: "table-cell", verticalAlign: "middle" }}>
                            <p className="walkthrough-explanation">You’re now ready. We hope you like it.</p>
                            <p className="walkthrough-explanation">You can always go through this menu again from the settings page.</p>
                        </div>
                    </div>
                    <img style={{ width: "350px", float: "right", verticalAlign: "middle" }} src={WalkthroughPhoto_19}></img>
                </div>
            );
        }

        //only show back button if it's not the first page
        var backButton;
        if (this.state.walkthroughPage > 0) {
            backButton = (
                <button style={{ width: "50px", marginRight: "10px" }} onClick={() => this.walkthroughBack()}>Back</button>
            );
        }
        else { //show a blank button so that the spacing stays even, letting you click through it real fast
            backButton = (
                <button style={{ width: "50px", height: "10px", marginRight: "10px", border: "none", cursor: "default" }}></button>
            );
        }

        //Buttons for back, next and skip
        walkthroughNav = (
            <div>
                <div style={{ margin: "20px auto 0px auto", height: "20px", textAlign: "center", width: "260px" }}>
        {/*backButton*/}
                    <button style={{ width: "50px", color: "green", border: "2px solid green", fontWeight: "bold" }} onClick={() => this.walkthroughNext()}>Next</button>
                    <button style={{ width: "50px", border: "none" }} onClick={() => this.props.finished() }>Skip</button>
                </div>
            </div>
        );

        //Compose everything together
        // TODO
        let backToHome = <div />;
        return (
            <div id="walkthrough">
                <div style={{ margin: "auto", width: "256px" }}>
                    {backToHome}
                </div>
                {walkthroughContents}
                {walkthroughNav}
            </div>
        );
    }
}

export default Walkthrough;
