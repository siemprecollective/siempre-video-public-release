import React from 'react';

class ElectronMain extends React.Component {
    constructor() {
        super();
        window.api.send("launch-sidebar");
    }

    render() {
        return <div></div>;
    }
};

export default ElectronMain;