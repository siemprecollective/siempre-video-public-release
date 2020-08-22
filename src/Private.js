import React from 'react'

import './Private.css';

class Private extends React.Component {
  componentDidMount() {
    this.updateVideo();
  }

  componentDidUpdate() {
    this.updateVideo();
  }

  updateVideo() {
    let idArray = this.props.ids;
    for (var index = 0; index < idArray.length; index++) {
      let video = document.querySelector("#private #video_"+idArray[index]);
      let stream = this.props.usersStream[idArray[index]];
      if ('srcObject' in video) {
        if (!video.srcObject) {
          video.srcObject = stream;
          video.play();
        } else if (stream !== video.srcObject) {
          try {
            video.pause();
            video.srcObject = stream;
            video.play();
          } catch (err) {
            console.log("error", err);
          }
        }
      }
    }
  }

  renderVideo(id) {
    return <video id={"video_"+id} />
  }

  render() {
    let idArray = this.props.ids;
    let nRows = 0;
    switch (idArray.length) {
      case 1:
      case 2:
        nRows = 1;
        break;
      case 3:
      case 4:
        nRows = 2;
        break;
      default:
        nRows = 3;
        break;
    }
    let nPerRow = idArray.length/nRows;
    if (window.innerHeight > window.innerWidth) {
      nPerRow = Math.ceil(idArray.length/4);
    }
    if (nPerRow === 0) {nPerRow= 1};
    nRows = Math.ceil(idArray.length/nPerRow);

    return (
      <div id="private" className={this.props.display? '' : 'no-display'}>
        { idArray.length === 0 ?
          <div className="empty-message">Pull a friend into here from the commons to talk to them privately</div>
        :
          null
        }
        {[...Array(nRows).keys()].map(row => {
          let rowIds = idArray.slice(row*nPerRow, (row+1)*nPerRow);
          return (
            <div className="private-row" key={row}>
            {rowIds.map(id => <div>{this.renderVideo(id)}</div>)}
            </div>
          );
        })}
        <div className="exit-button" alt="Exit Room" onClick={this.props.exitCall}><i className="fas fa-times" /></div>
      </div>
    );
  }
}

export default Private;
