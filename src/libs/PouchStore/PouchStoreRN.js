import PouchDB from './PouchDB.js';
import IPouchStore from './PouchStore.js';
import reactNativeSqlitePlugin from './pouchdb-adapter-react-native-sqlite';

PouchDB.plugin(reactNativeSqlitePlugin);

export default class PouchStore extends IPouchStore {
  constructor() {
    super();
    this.optionsLocal.adapter = 'react-native-sqlite';
  }
}
