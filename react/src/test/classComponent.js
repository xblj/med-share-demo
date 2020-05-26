import React, { Component } from '../react';

export default class ClassComponent extends Component {
  handleClick = () => {
    this.props.onClick();
  };
  render() {
    return <div onClick={this.handleClick}>我是类组件</div>;
  }
}
