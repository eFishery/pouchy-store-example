import React from 'react';
import PouchDB from 'pouchdb';
import generateReplicationId from './generateReplicationId';

import logo from './logo.svg';
import './App.css';

class App extends React.PureComponent {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

window.PouchDB = PouchDB;
window.generateReplicationId = generateReplicationId;
window.remoteUrl = 'http://localhost:5984/myremotedb';

window.localDB = new PouchDB('mylocaldb');
window.remoteDB = new PouchDB(window.remoteUrl);

window.syncDB = async () => {
  try {
    const result = await window.localDB.sync(window.remoteDB);
    console.log('syncDB', 'result', result);
  } catch (err) {
    console.log('syncDB', 'err', err);
  }
}

window.watcher = new (class Watcher {
  start() {
    if (this.handler) {
      this.stop();
    }
    this.handler = window.localDB.changes({
      since: 'now',
      live: true,
      include_docs: true,
    }).on('change', function (change) {
      console.log('localDB.changes.change', change);
    }).on('error', function (err) {
      console.log('localDB.changes.error', err);
    });
  }

  stop() {
    if (this.handler) {
      this.handler.cancel();
      delete this.handler;
    }
  }
})();

window.getUnsynced = async () => {
  try {
    const replicationId = await generateReplicationId(window.localDB, window.remoteDB, {});
    const replicationDoc = await window.localDB.get(replicationId);
    const unsynceds = await window.localDB.changes({
      since: replicationDoc.last_seq,
    });
    console.log(unsynceds);
  } catch (err) {
    console.log(err);
  }
}

export default App;
