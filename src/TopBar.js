import React from 'react';
import './TopBar.css';

class TopBar extends React.Component {
  render() {
    return (
      <div className={'top-bar ' + (this.props.display ? '' : 'no-display')}>
        {this.props.pages.map((pageInfo) => {
          let page = pageInfo[0];
          let pageDisplay = pageInfo[1];
          console.log(pageInfo);
          console.log(page, pageDisplay);
          return (
            <div key={page} className={'top-bar-selection' + (this.props.selected === page ? ' bold' : '')} onClick={() => this.props.changePage(page)}>
              {pageDisplay}
            </div>);
        })}
      </div>
    );
  }
}

export default TopBar;
