import PouchyStore from 'pouchy-store';

class UserStore extends PouchyStore {
  get name() {
    return 'user';
  }

  get isUseRemote() {
    return false;
  }

  get single() {
    return this.name;
  }
}

export default new UserStore();
