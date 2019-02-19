const TIMEOUT = 5; // seconds

export default () => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('No internet connection'));
    }, TIMEOUT*1000);

    fetch(`/?${Math.random()}`, { method: 'HEAD' }).then(() => {
      clearTimeout(timer);
      resolve(true);
    }).catch(() => {
      reject(new Error('No internet connection'));
    });
  });
}
