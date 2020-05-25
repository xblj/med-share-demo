import React, { Component } from './bak/react';
import ReactDOM from './bak/react-dom';

// import React, { Component } from 'react';
// import ReactDOM from 'react-dom';

class App extends Component {
  state = {
    num: 1,
  };

  // componentDidMount() {
  //   const btn = document.getElementsByTagName('button')[0];
  //   btn.addEventListener('click', () => {
  //     this.setState({ num: this.state.num + 1 });
  //   });
  // }

  handleClick = (e) => {
    // e.persist();

    console.log(e);
  };

  handleDivClick = () => {
    console.log('div');
  };

  handleStop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('a');
  };

  render() {
    return (
      <div onClick={this.handleDivClick}>
        <div style={{ color: 'red' }}>类组件:{this.state.num}</div>
        <button id='btn' className='class-name' onClick={this.handleClick}>
          点我
        </button>
        <a href='https://baidu.com' onClick={this.handleStop}>
          百度
        </a>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
