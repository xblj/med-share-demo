// import React, { Component } from './react';
// import ReactDOM from './react-dom';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class App extends Component {
  state = {
    num: 1,
  };

  componentDidMount() {
    const btn = document.getElementsByTagName('button')[0];
    btn.addEventListener('click', () => {
      this.setState({ num: this.state.num + 1 });
    });
  }

  render() {
    return (
      <div>
        <div>类组件:{this.state.num}</div>
        <button id='btn'>点我</button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
