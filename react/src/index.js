import React from './react';
import ReactDOM from './react-dom';
// import SetState from './test/setState';
// import EventComponent from './test/event';
// import KeyComponent from './test/key';
import ClassComponent from './test/classComponent';
// import FunctionComponent from './test/FunctionComponent';

const app = <ClassComponent onClick={() => alert(1)} />;
// const app = <SetState />;
// const app = <EventComponent />;
// const app = <KeyComponent />;
// const app = <FunctionComponent />;

ReactDOM.render(app, document.getElementById('root'));
