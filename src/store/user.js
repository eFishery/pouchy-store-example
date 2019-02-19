import PouchStore from '@/libs/PouchStore';

class UserStore extends PouchStore {
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
