import React from "react";

import BaseComponent from "@/components/BaseComponent";

class NewTodoform extends BaseComponent {
  constructor(props) {
    super(props);

    this.state = {
      input_text: this.props.text
    };
  }

  componentWillReceiveProps(props, newprops) {
    this.setState({
      input_text: props.text
    });
  }

  handleInputChange = event => {
    this.setState({
      input_text: event.target.value
    });
  };

  handleSubmit = async event => {
    event.preventDefault();
    if (this.props.mode === "edit") {
      await this.props.saveEditTodo(this.state.input_text);
    } else {
      await this.props.addTodo(this.state.input_text);
    }
    this.setState({ input_text: "" });
  };

  render() {
    return (
      <form className="form-inline mt-3" onSubmit={this.handleSubmit}>
        <input
          className="form-control mr-sm-2"
          style={{ flex: 1 }}
          type="text"
          placeholder="New todo"
          value={this.state.input_text}
          onChange={this.handleInputChange}
        />
        <button type="submit" className="btn btn-primary">
          {this.props.mode === "edit" ? "Save" : "Submit"}
        </button>
        {this.props.mode === "edit" ? (
          <button
            className="btn btn-danger ml-2"
            onClick={this.props.closeEdit}
          >
            Cancel
          </button>
        ) : null}
      </form>
    );
  }
}

export default NewTodoform;
