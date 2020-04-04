import React from "react";

import BaseComponent from "@/components/BaseComponent";

class TodoItem extends BaseComponent {
  get id() {
    return this.props.todo._id;
  }

  get text() {
    return this.props.todo.text;
  }

  get done() {
    return this.props.todo.done;
  }

  completeTodo = async (e, id) => {
    e.preventDefault();
    return this.props.completeTodo(id, e.currentTarget.checked);
  };

  render() {
    return (
      <li className="d-flex align-items-center list-group-item">
        <div className="custom-control custom-checkbox">
          <input
            type="checkbox"
            className="custom-control-input"
            id={`checkbox_${this.id}`}
            onChange={e => this.completeTodo(e, this.id)}
            checked={this.done}
          />
          <label
            className="custom-control-label"
            htmlFor={`checkbox_${this.id}`}
          >
            {" "}
          </label>
        </div>
        <p className="m-0 mr-auto">
          {this.done ? <s>{this.text}</s> : this.text}
          {!this.props.todosStore.checkIsUploaded(this.props.todo) &&
            ` (belum upload)`}
        </p>
        <button
          onClick={() => this.props.deleteTodo(this.id)}
          className="btn btn-danger btn-sm"
        >
          X
        </button>
      </li>
    );
  }
}

export default TodoItem;
