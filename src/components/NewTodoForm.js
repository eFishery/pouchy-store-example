import React from "react";

import BaseComponent from "@/components/BaseComponent";

class NewTodoform extends BaseComponent {
  state = {
    input_text: ""
  };

  handleInputChange = event => {
    this.setState({
      input_text: event.target.value
    });
  };

  addTodo = async event => {
    event.preventDefault();
    await this.props.addTodo(this.state.input_text);
    this.setState({ input_text: "" });
  };

  render() {
    return (
      <form className="form-inline mt-3" onSubmit={this.addTodo}>
        <input
          className="form-control mr-sm-2"
          style={{ flex: 1 }}
          type="text"
          placeholder="New todo"
          value={this.state.input_text}
          onChange={this.handleInputChange}
        />
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    );
  }
}

export default NewTodoform;
