import React from "react";

import LoginPage from "@/page/LoginPage";
import BaseComponent from "@/components/BaseComponent";
import TodoItem from "@/components/TodoItem";
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

    return userStore.data.email ? (
      <Home />
    ) : (
      <LoginPage userStore={userStore} />
    );
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

class Home extends BaseComponent {
  state = {
    mode: "new",
    selectedTask: {}
  };

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
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  todosStore={todosStore}
                  completeTodo={this.completeTodo}
                  startEditTodo={this.startEditTodo}
                  deleteTodo={this.deleteTodo}
                />
              ))}
            </ul>

            <NewTodoForm
              mode={this.state.mode}
              text={this.state.selectedTask.text || ""}
              addTodo={this.addTodo}
              saveEditTodo={this.saveEditTodo}
              closeEdit={this.closeEdit}
            />
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

  logout = async () => {
    await todosStore.deinitialize();
    await userStore.deleteSingle();
  };

  addTodo = async text => {
    await todosStore.addItem(
      {
        text,
        done: false
      },
      userStore.data
    );
  };

  startEditTodo = async (id, text, done) => {
    this.setState({
      mode: "edit",
      selectedTask: {
        id,
        text,
        done
      }
    });
  };

  closeEdit = () => {
    this.setState({
      mode: "new",
      selectedTask: {}
    });
  };

  saveEditTodo = async text => {
    await todosStore.editItem(
      this.state.selectedTask.id,
      {
        text,
        done: this.state.selectedTask.done
      },
      userStore.data
    );

    this.closeEdit();
  };

  deleteTodo = async id => {
    todosStore.deleteItem(id, userStore.data);
  };

  completeTodo = async (id, done) => {
    await todosStore.editItem(
      id,
      {
        done
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
