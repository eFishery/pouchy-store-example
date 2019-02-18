import IPouchStore from './IPouchStore';

class UserStore extends IPouchStore {
  get name() {
    return 'user';
  }

  get single() {
    return 'user';
  }

  get isUseRemote() {
    return false;
  }
}

export default new UserStore();
