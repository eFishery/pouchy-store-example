import PouchDB from '@/libs/PouchDB';
import checkInternet from '@/libs/checkInternet';
import config from '@/config';

/*

class options: create getter fo these:
- `this.isUseData` boolean: give false if you do not want to mirror db data to this.data. default to true.
- `this.isUseRemote` boolean: give false if you do not want to sync with remote db. default to true.
- `this.single` string: give string if you want single doc, not list. this is the ID of the doc. default to undefined.
- `this.dataDefault` optional: give array as default data, or object if single. default to `[]` if not single and `{}` if single.
*/

export default class MemoryStore {
  constructor() {
    if (!this.name) {
      throw new Error('store must have name');
    }

    // set default options
    if (!('isUseData' in this)) {
      this.isUseData = true;
    }
    if (!('isUseRemote' in this)) {
      this.isUseRemote = true;
    }

    // create the databases
    this.dbLocal = new PouchDB(this.name, { auto_compaction: true });
    this.dbMeta = new PouchDB(`${this.name}_meta`, { auto_compaction: true });
    if (this.isUseRemote) {
      this.dbRemote = new PouchDB(`${config.couchDBUrl}${this.name}`);
    }

    // initialize in-memory data
    if (this.single) {
      this.data = this.dataDefault || {};
    } else if (this.isUseData) {
      this.data = this.dataDefault || [];
    } else {
      Object.defineProperty(this, 'data', {
        get: () => {
          throw new Error('`this.data` is not available when `this.isUseData` does not return true');
        },
        set: () => {},
      });
    }

    this.dataMeta = {}; // metadata of this store
    this.changeFromRemote = {}; // flag downloaded data from remote DB
    this.subscribers = []; // subscribers of data changes
  }

  async initialize() {
    if (this.isInitialized) return;

    // init metadata
    this.dataMeta = await this.dbMeta.get2('meta') || {
      _id: 'meta',
      tsUpload: new Date(0).toJSON(),
      unuploadeds: {},
    };

    if (this.isUseRemote) {
      // sync data local-remote
      try {
        await checkInternet();
        await this.dbLocal.replicate.from(this.dbRemote);
        await this.upload();
      } catch (err) {
        console.error(err);
      }
    }

    // init data from PouchDB to memory
    const docs = await this.dbLocal.allDocs2();
    if (this.single) {
      this.data = docs.find(doc => doc._id === this.single) || this.data;
    } else if (this.isUseData) {
      this.data = docs.filter(doc => !('deletedAt' in doc) || doc.deletedAt === null);
    }

    this.isInitialized = true;
    if (this.single || this.isUseData) {
      this.notifySubscribers(this.data);
    } else {
      this.notifySubscribers(docs);
    }

    this.watchRemote();
    this.watchLocal();
  }

  updateMemory(doc) {
    if (!this.isUseData) return;

    if (this.single) {
      if (doc._id === this.single) {
        this.data = doc;
      }
    } else {
      const isDeleted = doc.deletedAt || doc._deleted;
      const index = this.data.findIndex(item => item._id === doc._id);
      if (index !== -1) {
        if (isDeleted) {
          this.data.splice(index, 1);
        } else {
          this.data[index] = doc;
        }
      } else {
        if (isDeleted) {
          // do nothing
        } else {
          this.data.push(doc);
        }
      }
    }
  }

  async updateMeta(payload) {
    await this.dbMeta.update('meta', payload);
    Object.assign(this.dataMeta, payload);
  }

  /* watch manager for local DB and remote DB */

  watchRemote() {
    if (!this.isUseRemote) return;

    this.downloadHandler = this.dbLocal.replicate.from(this.dbRemote, {
      live: true,
      retry: true,
    }).on('change', change => {
      for (let doc of change.docs) {
        this.changeFromRemote[doc._id] = true;
        this.updateMemory(doc);
      }
      this.notifySubscribers(change.docs);
    }).on('error', err => {
      console.error(`${this.name}.from`, 'error', err);
    })
  }

  unwatchRemote() {
    if (this.downloadHandler) {
      this.downloadHandler.cancel();
    }
  }

  watchLocal() {
    this.dbLocal.changes({
      since: 'now',
      live: true,
      include_docs: true,
    }).on('change', change => {
      const doc = change.doc;
      if (this.changeFromRemote[doc._id]) {
        delete this.changeFromRemote[doc._id];
      } else {
        this.updateMemory(doc);
        this.notifySubscribers([ doc ]);
      }
    }).on('error', err => {
      console.error(`${this.name}.changes`, 'error', err);
    });
  }

  /* data upload (from local DB to remote DB) */

  checkIsUploaded(doc) {
    return !this.dataMeta.unuploadeds[doc._id];
  }

  countUnuploadeds() {
    return Object.keys(this.dataMeta.unuploadeds || {}).length;
  }

  async upload() {
    if (!this.isUseRemote) return;

    const unuploadeds = Object.keys(this.dataMeta.unuploadeds).map(_id => {
      return { _id };
    });
    await this.dbLocal.replicate.to(this.dbRemote);
    await this.updateMeta({
      tsUpload: new Date().toJSON(),
      unuploadeds: {},
    });
    this.notifySubscribers(unuploadeds);
  }

  /* manipulation of array data (non-single) */

  async addItem(payload, user=null) {
    const id = this.dbLocal.createId();
    const now = new Date().toJSON();
    await this.updateMeta({
      unuploadeds: {
        ...this.dataMeta.unuploadeds,
        [id]: true,
      },
    });
    await this.dbLocal.put({
      ...payload,
      _id: id,
      createdAt: now,
      createdBy: user,
      deletedAt: null,
    });
  }

  async editItem(id, payload, user=null) {
    const now = new Date().toJSON();
    const doc = await this.dbLocal.get2(id);
    if (!doc) return;

    await this.updateMeta({
      unuploadeds: {
        ...this.dataMeta.unuploadeds,
        [id]: true,
      },
    });
    await this.dbLocal.put({
      ...doc,
      ...payload,
      updatedAt: now,
      updatedBy: user,
    });
  }

  async deleteItem(id, user=null) {
    const now = new Date().toJSON();
    const doc = await this.dbLocal.get2(id);
    if (!doc) return;

    const isRealDelete = doc.deletedAt || doc.createdAt > this.dataMeta.tsUpload;
    if (isRealDelete) {
      delete this.dataMeta.unuploadeds[id];
      await this.updateMeta({
        unuploadeds: {
          ...this.dataMeta.unuploadeds,
        },
      });
      await this.dbLocal.remove(doc);
    } else {
      await this.updateMeta({
        unuploadeds: {
          ...this.dataMeta.unuploadeds,
          [id]: true,
        },
      });
      await this.dbLocal.put({
        ...doc,
        deletedAt: now,
        deletedBy: user,
      });
    }
  }

  /* manipulation of single data (non-array) */

  async editSingle(payload) {
    const doc = await this.dbLocal.get2(this.single) || { _id: this.single };
    await this.updateMeta({
      unuploadeds: {
        ...this.dataMeta.unuploadeds,
        [doc._id]: true,
      },
    });
    await this.dbLocal.put({
      ...doc,
      ...payload,
    });
  }

  async deleteSingle() {
    const doc = await this.dbLocal.get2(this.single) || { _id: this.single };
    const payload = {};
    if (doc._rev) {
      payload._rev = doc._rev;
      Object.assign(payload, this.dataDefault || {});
    }
    await this.updateMeta({
      unuploadeds: {
        ...this.dataMeta.unuploadeds,
        [doc._id]: true,
      },
    });
    await this.dbLocal.put({
      _id: doc._id,
      ...payload,
    });
  }

  /* subscription manager */

  subscribe(subscriber) {
    const index = this.subscribers.findIndex(item => item === subscriber);
    if (index !== -1) return;

    this.subscribers.push(subscriber);
    return () => this.unsubscribe(subscriber);
  }

  unsubscribe(subscriber) {
    const index = this.subscribers.findIndex(item => item === subscriber);
    if (index === -1) return;

    this.subscribers.splice(index, 1);
  }

  notifySubscribers(docs) {
    if (!this.isInitialized) return;

    if (this.isUseData) {
      // create new array/object reference
      if (this.single) {
        this.data = { ...this.data };
      } else {
        this.data = Array.from(this.data);
      }
    }
    for (let subscriber of this.subscribers) {
      try {
        subscriber(docs);
      } catch (err) {
        console.error(err);
      }
    }
  }
}
