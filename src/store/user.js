import PouchStore from '@/libs/PouchStore';

class UserStore extends PouchStore {
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
