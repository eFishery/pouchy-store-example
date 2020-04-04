import React from "react";

import BaseComponent from "@/components/BaseComponent";
import NewTodoForm from "@/components/NewTodoForm";

import userStore from "@/store/user";
import todosStore from "@/store/todos";

// for playin in browser console
window.userStore = userStore;
window.todosStore = todosStore;

class App extends BaseComponent {
  state = {
    isInitialized: false
  };

  render() {
    if (!this.state.isInitialized) {
      return null;
    }

    return userStore.data.email ? <Home /> : <Login />;
  }

  async componentDidMount() {
    await userStore.initialize();
    this.setState({
      isInitialized: true
    });

    this.unsubUser = userStore.subscribe(this.rerender);
  }

  async componentDidUpdate() {
    if (userStore.data.email && !todosStore.isInitialized) {
      console.log("popup initialize all offline data...");
      todosStore.setName(userStore.data.id);
      await todosStore.initialize();
      console.log("popup done");
    }
  }

  componentWillUnmount() {
    this.unsubUser();
  }
}

class Login extends BaseComponent {
  state = {
    email: ""
  };

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col col-md-4 offset-md-4">
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">Login</h5>
                <form onSubmit={this.submit}>
                  <div className="form-group">
                    <label forhtml="exampleInputEmail1">Email</label>
                    <input
                      type="text"
                      className="form-control"
                      value={this.state.email}
                      placeholder="email@gmail.com"
                      onChange={this.setInput_email}
                    />
                  </div>
                  <div className="form-group">
                    <button type="submit" class="btn btn-primary">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  setInput_email = event => {
    this.setState({
      email: (event.target.value || "").trim()
    });
  };

  submit = async event => {
    event.preventDefault();

    if (!this.state.email) {
      alert("gunakan email @gmail");
      return;
    }
    if (!this.state.email.endsWith("@gmail.com")) {
      alert("gunakan email @gmail.com");
      return;
    }

    let id = this.state.email;
    id = id
      .split("@")
      .shift()
      .replace(/\W/g, "");

    await userStore.editSingle({
      id,
      email: this.state.email
    });
  };
}

class Home extends BaseComponent {
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col col-md-8 offset-md-2">
            <div className="d-flex align-items-center mt-3 mb-3">
              <p className="m-0 mr-auto">Hi, {userStore.data.email} </p>
              <button onClick={this.logout} className="btn btn-secondary">
                Logout
              </button>
            </div>

            <h2>
              Todos:{" "}
              <button
                onClick={this.syncData}
                className="btn btn-warning btn-sm"
              >
                {`Sync (${todosStore.countUnuploadeds()})`}
              </button>
            </h2>
            <pre>Last sync: {todosStore.dataMeta.tsUpload}</pre>

            <ul className="list-group">
              {todosStore.data.map((todo, index) => (
                <li
                  key={todo._id}
                  className="d-flex align-items-center list-group-item"
                >
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id={`checkbox_${todo._id}`}
                      onClick={e => this.completeTodo(e, todo._id)}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor={`checkbox_${todo._id}`}
                    >
                      {" "}
                    </label>
                  </div>
                  <p className="m-0 mr-auto">
                    {todo.done ? <s>{todo.text}</s> : todo.text}
                    {!todosStore.checkIsUploaded(todo) && ` (belum upload)`}
                  </p>
                  <button
                    onClick={() => this.deleteTodo(todo._id)}
                    className="btn btn-danger btn-sm"
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>

            <NewTodoForm addTodo={this.addTodo} />
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.unsubTodos = todosStore.subscribe(this.rerender);
  }

  componentWillUnmount() {
    this.unsubTodos();
  }

  setInput_text = event => {
    this.setState({
      input_text: event.target.value
    });
  };

  logout = async () => {
    await todosStore.deinitialize();
    await userStore.deleteSingle();
  };

  addTodo = async text => {
    await todosStore.addItem(
      {
        text
      },
      userStore.data
    );
  };

  deleteTodo = async id => {
    todosStore.deleteItem(id, userStore.data);
  };

  completeTodo = async (e, id) => {
    await todosStore.editItem(
      id,
      {
        done: e.currentTarget.checked
      },
      userStore.data
    );
  };

  syncData = async () => {
    console.log("uploading...");
    try {
      await todosStore.upload();
      console.log("upload done");
    } catch (err) {
      alert(err.message);
      console.log("upload failed");
    }
  };
}

export default App;
