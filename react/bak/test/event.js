import React, { Component } from 'react';

export default class EventComponent extends Component {
  handleClick = (e) => {
    e.persist();
    console.log(e);
  };

  render() {
    return (
      <div className='div-class'>
        <button id='syncBtn' onClick={this.handleClick}>
          点我
        </button>
      </div>
    );
  }
}
