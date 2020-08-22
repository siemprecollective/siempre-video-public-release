import EventProvider from './EventProvider.js';

class LocalPreferences extends EventProvider {
  constructor() {
    super([]);
    window.addEventListener('storage', (e) => {
      this.fire(e.key, JSON.parse(e.newValue));
    })
  }

  setDefault(key, value) {
    if (localStorage[key] === undefined) {
      this.set(key, value)
    }
  }

  set(key, value) {
    localStorage[key] = JSON.stringify(value);
    this.fire(key, value);
  }

  get(key) {
    if (localStorage[key] === undefined) {
      return undefined;
    }
    return JSON.parse(localStorage[key]);
  }
}

let localPreferences = new LocalPreferences();

export {localPreferences} ;
