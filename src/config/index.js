export default {
  couchDBUrl: (
    process.env.NODE_ENV !== 'production' ? (
      'http://localhost:5984/'
    ) : (
      'http://couchdb.efishery.com:5984/'
    )
  ),
};
