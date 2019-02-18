import IPouchDB from 'pouchdb';

export default class PouchDB extends IPouchDB {
  async get2(id) {
    try {
      const doc = await this.get(id);
      return doc;
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async update(id, obj) {
    const doc = await this.get2(id) || { _id: id };
    Object.assign(doc, obj);
    const info = await this.put(doc);
    return info;
  }

  createId() {
    const time = (new Date()).getTime().toString(16);
    let rand = Math.random().toString(16).split('.').pop().substr(0, 4);
    while (rand.length < 4) {
      rand += '0';
    }
    return `${time}_${rand}`;
  }

  async allDocs2() {
    const result = await this.allDocs({
      include_docs: true,
    });
    const docs = result.rows.map(row => row.doc);
    return docs;
  }
}
