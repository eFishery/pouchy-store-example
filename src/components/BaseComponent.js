import React from "react";

class BaseComponent extends React.PureComponent {
  rerender = () => {
    this.setState({
      _rerender: new Date()
    });
  };
}

export default BaseComponent;
