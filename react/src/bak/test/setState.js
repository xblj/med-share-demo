import React, { Component } from 'react';

export default class App extends Component {
  state = {
    number: 1,
  };

  componentDidMount() {
    const btn = document.getElementById('syncBtn');
    btn.addEventListener('click', () => {
      console.log('addEventListener start', this.state.number);
      this.setState({ number: this.state.number + 1 });
      this.setState({ number: this.state.number + 1 });

      console.log('addEventListener end', this.state.number);
    });
  }

  handleClick = () => {
    this.setState({ number: this.state.number + 1 });
    this.setState({ number: this.state.number + 1 });
    console.log('outer', this.state.number);

    setTimeout(() => {
      console.log('inner start', this.state.number);
      this.setState({ number: this.state.number + 1 });
      this.setState({ number: this.state.number + 1 });

      console.log('inner end', this.state.number);
    }, 0);
  };

  render() {
    return (
      <div className='div-class'>
        <div>{this.state.number}</div>
        <button onClick={this.handleClick}>点我</button>
        <button id='syncBtn'>点我同步更新</button>
      </div>
    );
  }
}
