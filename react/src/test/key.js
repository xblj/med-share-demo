import React, { Component } from 'react';

export default class EventComponent extends Component {
  state = {
    list: [1, 2, 3],
  };
  handleClick = (e) => {
    this.state.list.reverse();
    this.setState({
      list: this.state.list,
    });
  };

  render() {
    return (
      <div className='div-class'>
        <ul>
          {this.state.list.map((item, index) => {
            return <li key={index}>{item}</li>;
          })}
        </ul>
        <ul>
          {this.state.list.map((item, index) => {
            return (
              <li key={index}>
                <input defaultValue={item} />
              </li>
            );
          })}
        </ul>
        <button id='syncBtn' onClick={this.handleClick}>
          点我
        </button>
      </div>
    );
  }
}
