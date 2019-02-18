import IPouchStore from './IPouchStore';

class TodosStore extends IPouchStore {
  get name() {
    return 'todos';
  }
}

export default new TodosStore();
