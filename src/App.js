import React from 'react';
import interact from 'interactjs';

import './reset.css';
import './App.css';
import Home from './Home.js';
import Main from './Main.js';

import ElectronMain from './ElectronMain.js';
import ElectronSide from './ElectronSide.js';
import ElectronSettings from './ElectronSettings.js';
import ElectronPermissions from './ElectronPermissions.js';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: null
    };
    interact.pointerMoveTolerance(20);
    
    var url = new URL(window.location);
    var ui = url.searchParams.get("ui");

    if (ui === "electronMain") {
      this.MainElement = ElectronMain;
    } else if (ui === "electronSide") {
      this.MainElement = ElectronSide;
    } else if (ui === "electronSettings") {
      this.MainElement = ElectronSettings;
    } else if (ui === "electronPermissions") {
      this.MainElement = ElectronPermissions;
    } else {
      this.MainElement = Main;
    }
  }

  updateStateId(userId) {
    this.setState({ id: userId });
  }

  render() {
    console.log(this.state.id);
    if (this.state.id === null) {
      return <Home updateId={this.updateStateId.bind(this)} />;
    } else {
      return <this.MainElement updateId={this.updateStateId.bind(this)} id={this.state.id} />;
    }
  }
}

export default App;
