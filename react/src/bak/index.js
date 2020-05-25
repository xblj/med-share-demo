import React from './react';
import ReactDOM from './react-dom';
// import SetState from './test/setState';
// import EventComponent from './test/event';
// import KeyComponent from './test/key';
// import ClassComponent from './test/classComponent';
import FunctionComponent from './test/FunctionComponent';

// $$typeof: Symbol(react.element);
// key: null;
// props: children: '121';
// type: 'div';

// const app = React.createElement(
//   'div',
//   {
//     key: 'key1',
//     style: {
//       backgroundColor: 'red',
//     },
//     className: 'my-div',
//   },
//   '一个div'
// );

// function App() {
//   return (
//     <div style={{ backgroundColor: 'red' }} className='div-class'>
//       <div>div</div>
//       <span>span</span>
//     </div>
//   );
// }

function Fun() {
  return <div>我是函数组件</div>;
}

// const app = (
//   <div style={{ backgroundColor: 'red' }} className='div-class'>
//     121
//   </div>
// );

// const app = <ClassComponent />;
// const app = <SetState />;
// const app = <EventComponent />;
// const app = <KeyComponent />;
const app = <FunctionComponent />;

ReactDOM.render(app, document.getElementById('root'));
