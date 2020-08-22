import React from 'react';
import interact from 'interactjs';

import Video from './Video.js';
import {db} from './constants.js';
import {touchInfo} from './TouchInfo.js';
import {localPreferences} from './LocalPreferences.js';

import Logo from './res/Logo.png';

import './CommonsAlt.css';

function defaultdict(dict, defaultElement) {
  return new Proxy(dict, {
    get: (target, name) => (name in target ? target[name] : {}),
  });
}

class CommonsAlt extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pinnedIds: {},
      shelvedIds: {},
      lastInCall: defaultdict({}, false),
      lastFriends: defaultdict({}, {}),
      lastStatus: -1,
    };
  }

  static shouldShow(props, id) {
    if (id === props.id) {
      return false;
    }
    if (props.isPrivate && id in props.inCall) {
      return false;
    }
    if (!props.pluggedIn[id] && !(id in props.inCall)) {
      return false;
    }
    return true;
  }
  static availableForCall(inCall, friends, id) {
    return id in inCall || (friends[id].active && friends[id].status === 0 && friends[id].roomId === '');
  }
  static streamingVideo(inCall, friends, id) {
    return id in inCall || (friends[id].active && [0, 1].includes(friends[id].status) && !friends[id].inPrivate);
  }
  static sortIds(props, idA, idB) {
    // TODO I don't think this works
    const availableForCall = CommonsAlt.availableForCall.bind({}, props.inCall, props.friends);
    const streamingVideo = CommonsAlt.streamingVideo.bind({}, props.inCall, props.friends);
    if (idA in props.inCall !== idB in props.inCall) {
      return idA in props.inCall ? -1 : 1;
    } else if (availableForCall(idA) !== availableForCall(idB)) {
      return availableForCall(idA) ? -1 : 1;
    } else if (streamingVideo(idA) !== streamingVideo(idB)) {
      return streamingVideo(idA) ? -1 : 1;
    }
    return props.friends[idA].name < props.friends[idB].name ? -1 : 1;
  }

  static getDerivedStateFromProps(props, state) {
    const shouldShow = CommonsAlt.shouldShow.bind({}, props);
    const streamingVideo = CommonsAlt.streamingVideo.bind({}, props.inCall, props.friends);
    let allVisible = Object.assign({}, props.friends);
    allVisible = Object.assign(allVisible, props.inCall);
    allVisible = Object.keys(allVisible).filter(shouldShow);

    let newPinnedIds = Object.assign({}, state.pinnedIds);

    let changedIds = allVisible.filter(id => streamingVideo(id) !== CommonsAlt.streamingVideo(state.lastInCall, state.lastFriends, id));
    if (state.lastStatus === 2 && [0, 1].includes(props.myStatus)) {
      changedIds = allVisible;
    }
    changedIds.forEach(id => {
      if (streamingVideo(id)) {
        newPinnedIds[id] = true;
      } else {
        delete newPinnedIds[id];
      }
    });

    return {
      pinnedIds: newPinnedIds,
      lastInCall: props.inCall,
      lastFriends: defaultdict(props.friends, {}),
      lastStatus: props.myStatus,
    };
  }

  getArrangement() {
    const shouldShow = CommonsAlt.shouldShow.bind({}, this.props);
    const sortIds = CommonsAlt.sortIds.bind({}, this.props);
    let allVisible = {};
    Object.keys(this.props.friends).forEach(id => {
      if (shouldShow(id)) {
        allVisible[id] = true;
      }
    });
    Object.keys(this.props.inCall).forEach(id => {
      if (shouldShow(id)) {
        allVisible[id] = true;
      }
    });

    if (this.props.myStatus === 2) {
      return [[], Object.keys(allVisible).sort(sortIds)];
    } else {
      let mainVisible = {};
      let sideVisible = {};
      Object.keys(allVisible).forEach(id => {
        if (id in this.state.pinnedIds) {
          mainVisible[id] = true;
        } else {
          sideVisible[id] = true;
        }
      });

      let sortedMainIds = Object.keys(mainVisible).sort(sortIds);
      let sortedSideIds = Object.keys(sideVisible).sort(sortIds);

      return [sortedMainIds, sortedSideIds];
    }
  }

  componentDidMount() {
    this.initializeInteract();

    // TODO this should be on main
    document.addEventListener('visibilitychange', () => {
      console.log('visiblity change');
      if (document.hidden) {
        this.changeStatus(2);
      }
    });
  }

  initializeInteract() {
    function dragMoveListener(event) {
      // TODO use x0 and y0 instead of managing data-x manually
      var target = event.target;
      // keep the dragged position in the data-x/data-y attributes
      var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      var scale = parseFloat(target.getAttribute('data-scale'));

      // translate the element
      target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ', ' + scale + ')';

      // update the position attributes
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
    }

    interact('#commons-alt .video-container')
      .draggable({
        onmove: dragMoveListener.bind(this),
      })
      .on('dragstart', event => {
        touchInfo.notifyDragging(true);
        event.target.classList.remove('animate-fill');
        document.getElementById('commons-private-indicator').style.display = 'block';
        document.getElementById('commons-private-indicator').classList.remove('will-drop');
        document.getElementById('commons-all-indicator').style.display = 'block';
        document.getElementById('commons-all-indicator').classList.remove('will-drop');
        document.getElementById('commons-side').classList.add('dragging');

        event.target.style.zIndex = 99;
        let rect = event.target.getBoundingClientRect();
        let scale = 100 / rect.height;
        event.target.setAttribute('data-x', event.x0 - rect.left - rect.width / 2);
        event.target.setAttribute('data-y', event.y0 - rect.top - rect.height / 2);
        event.target.setAttribute('data-scale', scale);
      })
      .on('dragend', event => {
        touchInfo.notifyDragging(false);
        event.target.style.zIndex = '';
        event.target.style.webkitTransform = event.target.style.transform = '';
        event.target.setAttribute('data-x', 0);
        event.target.setAttribute('data-y', 0);

        document.getElementById('commons-private-indicator').style.display = 'none';
        document.getElementById('commons-all-indicator').style.display = 'none';
        document.getElementById('commons-side').classList.remove('dragging');
      });

    interact('#commons-alt #commons-main')
      .dropzone({
        accept: '#commons-alt .video-container',
        ondrop: event => {
          event.target.classList.remove('will-drop');
          this.setState(prevState => {
            let pinnedIds = Object.assign({}, prevState.pinnedIds);
            pinnedIds[event.relatedTarget.getAttribute('data-id')] = true;
            // # of children of commons-main + 1, or the current threshold, whatever's bigger
            return {
              pinnedIds: pinnedIds,
            };
          });
        },
      })
      .on('dragenter', event => {
        event.target.classList.add('will-drop');
      })
      .on('dragleave', event => {
        event.target.classList.remove('will-drop');
      });
    interact('#commons-alt #commons-side')
      .dropzone({
        accept: '#commons-alt .video-container',
        ondrop: event => {
          event.target.classList.remove('will-drop');
          this.setState(prevState => {
            let pinnedIds = Object.assign({}, prevState.pinnedIds);
            delete pinnedIds[event.relatedTarget.getAttribute('data-id')];
            return {
              pinnedIds: pinnedIds,
            };
          });
        },
      })
      .on('dragenter', event => {
        event.target.classList.add('will-drop');
      })
      .on('dragleave', event => {
        event.target.classList.remove('will-drop');
      });

    interact('#commons-alt #commons-private-indicator')
      .dropzone({
        accept: '#commons-alt .video-container',
      })
      .on('dragenter', event => {
        let id = event.relatedTarget.getAttribute('data-id');
        event.target.classList.add('will-drop');
        this.props.addPrivateId(id);
      })
      .on('dragleave', event => {
        event.target.classList.remove('will-drop');
      });
    interact('#commons-alt #commons-all-indicator')
      .dropzone({
        accept: '#commons-alt .video-container',
      })
      .on('dragenter', event => {
        let id = event.relatedTarget.getAttribute('data-id');
        event.target.classList.add('will-drop');
        let updateObj = {};
        updateObj['pluggedIn.' + id] = false
        db.collection('users').doc(this.props.id).update(updateObj);
      })
      .on('dragleave', event => {
        event.target.classList.remove('will-drop');
      });
  }

  changeStatus(newStatus) {
    db.collection('users')
      .doc(this.props.id)
      .update({
        status: newStatus,
        statusTimeout: null,
      });
  }

  renderVideo(id, inSideBar) {
    return (
      <Video
        key={id}
        ownId={this.props.id}
        id={id}
        myStatus={this.props.myStatus}
        stream={this.props.usersStream[id]}
        status={id in this.props.friends ? this.props.friends[id].status : 0}
        inPrivate={id in this.props.friends ? this.props.friends[id].inPrivate : false}
        inCall={id in this.props.friends? this.props.friends[id].roomId !== "" : false}
        onMobile={id in this.props.friends ? this.props.friends[id].onMobile : false}
        active={id in this.props.friends? this.props.friends[id].active : true}
        name={id in this.props.friends? this.props.friends[id].name : "Unknown"}
        profilePicturePath={id in this.props.friends? this.props.friends[id].profilePicturePath : ""}
        textStatus={id in this.props.friends ? this.props.friends[id].textStatus : ""}
        isEnlarged={!inSideBar}
        inCallWith={id in this.props.inCall}
        enterCall={this.props.enterCall}
        exitCall={this.props.exitCall}
      />
    );
  }

  render() {
    if (Object.keys(this.props.friends).length === 0) {
      return (
        <div id="commons-alt" className={this.props.display ? '' : 'no-display'}>
        <div className="no-friends-message-container">
          <div className="no-friends-message">
            <p>To add friends, go to the all friends page!</p>
            <p>If you've already sent them requests, you can help them get setup in the meantime.</p>
          </div>
        </div>
        </div>
      );
    }

    let [sortedMainIds, sortedSideIds] = this.getArrangement();
    /* TODO capture orientation change rerender */
    let maxPerColumnSide = window.innerHeight / 100;

    let nMainRows = 0;
    switch (sortedMainIds.length) {
      case 1:
        nMainRows = 1;
        break;
      case 2:
      case 3:
      case 4:
        nMainRows = 2;
        break;
      default:
        nMainRows = 3;
        break;
    }
    let nPerRowMain = sortedMainIds.length / nMainRows;
    if (window.innerHeight > window.innerWidth) {
      nPerRowMain = Math.ceil(sortedMainIds.length / 4);
      if (nPerRowMain === 0) {
        nPerRowMain = 1;
      }
      nMainRows = Math.ceil(sortedMainIds.length / nPerRowMain);
    }

    let nPerRowSide = Math.ceil(sortedSideIds.length / maxPerColumnSide);
    if (nPerRowSide === 0) {
      nPerRowSide = 1;
    }
    let nSideRows = Math.ceil(sortedSideIds.length / nPerRowSide);
    return (
      <div id="commons-alt" className={this.props.display ? '' : 'no-display'}>
        <div id="commons-side">
          <div className="commons-section-shade"></div>
          {[...Array(nSideRows).keys()].map(row => {
            let rowIds = sortedSideIds.slice(row * nPerRowSide, (row + 1) * nPerRowSide);
            return (
              <div className="commons-side-row" key={row}>
                {rowIds.map(id => (
                  <div key={id}>{this.renderVideo(id, true)}</div>
                ))}
              </div>
            );
          })}
        </div>
        <div id="commons-main">
          <div className="commons-section-shade"></div>
          {[...Array(nMainRows).keys()].map(row => {
            let rowIds = sortedMainIds.slice(row * nPerRowMain, (row + 1) * nPerRowMain);
            return (
              <div className="commons-main-row" key={row}>
                {rowIds.map(id => (
                  <div key={id}>{this.renderVideo(id, false)}</div>
                ))}
              </div>
            );
          })}
        </div>
        <div id="commons-private-indicator">
          <div>
            private <i className="fas fa-arrow-right" />
          </div>
        </div>
        <div id="commons-all-indicator">
          <div>
            <i className="fas fa-arrow-left" /> unplug
          </div>
        </div>
      </div>
    );
  }
}

export default CommonsAlt;
