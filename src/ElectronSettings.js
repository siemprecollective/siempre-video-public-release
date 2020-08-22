import React from 'react';

import TopBar from './TopBar.js'
import Settings from './Settings.js';
import All from './All.js';

import { db } from './constants.js';

import './ElectronSettings.css';

class ElectronSettings extends React.Component {
    constructor() {
        super();
        this.state = {
            name: "",
            friends: {},
            pluggedIn: {},
            whichPage: "all",
            profilePicturePath: "",
        }
    }

    componentDidMount() {
        db.collection("users").doc(this.props.id)
            .onSnapshot((doc) => {
                let pluggedIn = doc.data()["pluggedIn"];
                let name = doc.data()["name"];
                this.setState({ name: name, pluggedIn: pluggedIn });
                let picturePath = doc.data()["profilePicturePath"];
                if (picturePath) {
                    this.setState({ profilePicturePath: picturePath });
                }
            });
        db.collection("statuses").doc(this.props.id)
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                this.setState({ friends: doc.data() });
            });
    }

    changeMainComponent(page) {
        this.setState({whichPage: page});
    }

    render() {
        return (
            <div id="main" className="main-container electron-main-container">
                <div className="main-flex-container">
                    <div id="background" className="content-container">
                        <TopBar
                            selected={this.state.whichPage}
                            changePage={this.changeMainComponent.bind(this)}
                            display={true}
                            pages={[["settings", "Settings"], ["all", "All Friends"]]}
                        />
                        <div className="main-component">
                            <All
                                id={this.props.id}
                                display={this.state.whichPage === "all"}
                                friends={this.state.friends}
                                pluggedIn={this.state.pluggedIn}
                            />
                            <Settings
                                display={this.state.whichPage === "settings"}
                                id={this.props.id}
                                name={this.state.name}
                                profilePicturePath={this.state.profilePicturePath}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default ElectronSettings;
