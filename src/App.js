import React from 'react';

import userStore from '@/store/user';
import todosStore from '@/store/todos';

// for playin in browser console
window.userStore = userStore;
window.todosStore = todosStore;

class BaseComponent extends React.PureComponent {
  rerender = () => {
    this.setState({
      _rerender: new Date(),
    });
  }
}

class App extends BaseComponent {
  state = {
    isInitialized: false,
  }

  render() {
    if (!this.state.isInitialized) {
      return null;
    }

    return (
      userStore.data.email ? (
        <Home />
      ) : (
        <Login />
      )
    );
  }

  async componentDidMount() {
    await userStore.initialize();
    this.setState({
      isInitialized: true,
    });

    this.unsubUser = userStore.subscribe(this.rerender);
  }

  async componentDidUpdate() {
    if (userStore.data.email && !todosStore.isInitialized) {
      console.log('popup initialize all offline data...');
      todosStore.setName(userStore.data.id);
      await todosStore.initialize();
      console.log('popup done');
    }
  }

  componentWillUnmount() {
    this.unsubUser();
  }
}

class Login extends BaseComponent {
  state = {
    email: '',
  }

  render() {
    return (
      <form onSubmit={this.submit}>
        <h1>login</h1>
        <p>
          email <input type='text' value={this.state.email} onChange={this.setInput_email} />
        </p>
        <p>
          <button>submit</button>
        </p>
      </form>
    );
  }

  setInput_email = (event) => {
    this.setState({
      email: (event.target.value || '').trim(),
    });
  }

  submit = async (event) => {
    event.preventDefault();

    if (!this.state.email) {
      alert('gunakan email @gmail');
      return;
    }
    if (!this.state.email.endsWith('@gmail.com')) {
      alert('gunakan email @gmail.com');
      return;
    }

    let id = this.state.email;
    id = id.split('@').shift().replace(/\W/g, '');

    await userStore.editSingle({
      id,
      email: this.state.email,
    });
  }
}

class Home extends BaseComponent {
  state = {
    input_text: '',
  }

  render() {
    return (
      <div>
        <p>
          halo {userStore.data.email} <button onClick={this.logout}>logout</button>
        </p>

        <h2>
          todos: <button onClick={this.upload}>
            {`upload (${todosStore.countUnuploadeds()})`}
          </button>
        </h2>
        <pre>
          last upload: {todosStore.dataMeta.tsUpload}
        </pre>
        {
          todosStore.data.map((todo, index) => (
            <p key={todo._id}>
              {index + 1}. {todo.text}
              {
                !todosStore.checkIsUploaded(todo) && (
                  ` (belum upload)`
                )
              }
              {` `}
              <button onClick={() => this.deleteTodo(todo._id)}>
                X
              </button>
            </p>
          ))
        }

        <h2>add new todo</h2>
        <form onSubmit={this.addTodo}>
          <p><input type='text' value={this.state.input_text} onChange={this.setInput_text} /></p>
          <p><button>submit</button></p>
        </form>
      </div>
    );
  }

  componentDidMount() {
    this.unsubTodos = todosStore.subscribe(this.rerender);
  }

  componentWillUnmount() {
    this.unsubTodos();
  }

  setInput_text = (event) => {
    this.setState({
      input_text: event.target.value,
    });
  }

  logout = async () => {
    await todosStore.deinitialize();
    await userStore.deleteSingle();
  }

  addTodo = async (event) => {
    event.preventDefault();
    await todosStore.addItem({
      text: this.state.input_text,
    }, userStore.data);
    this.setState({ input_text: '' });
  }

  deleteTodo = async (id) => {
    todosStore.deleteItem(id, userStore.data);
  }

  upload = async () => {
    console.log('uploading...');
    try {
      await todosStore.upload();
      console.log('upload done');
    } catch (err) {
      alert(err.message);
      console.log('upload failed');
    }
  }
}

export default App;
