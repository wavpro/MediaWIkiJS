//Version 0.10.1

class Client {
  constructor(baseURL = "https://corsproxy.albinhedwall.repl.co/jojowiki.com/api.php") {
    this.baseURL = baseURL;
  }
  search(term) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const args = _this._util.getDefaultArgs("GET");
      args.list = 'search';
      args.action = 'query';
      args.srsearch = term;
      const response = JSON.parse(await _this._get(args));
      response.query.search = _this._util.rawPageArrayTo(response.query.search, _this)
      resolve(response);
    })
  }
  getPage(pageTitle) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const info = await getPageInfo(pageTitle);
      _this.pageHandler.add(info);
      // REMOVE IF SLOW
      await _this.pageHandler.get(raw.pageid).refreshAll();
      resolve();
    })
  }
  getPageInfo(pageTitle) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const args = _this._util.getDefaultArgs("GET");
      args.action = 'query';
      args.titles = pageTitle;
      args.prop = 'info';
      const response = JSON.parse(await _this._get(args));
      resolve(response.query.pages[pageID]);
    })
  }
  getPageText(pageTitle, format) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const args = _this._util.getDefaultArgs("GET");
      args.action = 'parse';
      args.formatversion = 2;
      if (format.toLowerCase() == "html") {
        args.prop = 'text';
      }
      args.page = pageTitle;
      const response = JSON.parse(await _this._get(args));
      resolve(response.parse);
    })
  }
  getPageCategories(pageTitle, pageID) {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      const args = _this._util.getDefaultArgs("GET");
      args.action = 'query';
      args.titles = pageTitle;
      args.prop = 'categories';
      const response = JSON.parse(await _this._get(args));
      resolve(response.query.pages[pageID]);
    })
  }
  _get(args) {
    const _this = this;
    return new Promise((resolve, reject) => {
      if ((typeof args).toLowerCase() == 'object') {
        args = _this.util.stringifyArgs("GET", args);
      }
      fetch(`${_this.baseURL}?${args}`)
        .then(res => res.text())
        .then(res => {
          resolve(res);
        })
        .catch(reject);
      })
  }
  _util = {
    stringifyArgs: ((method, args) => {
      let result = "";
      if (method == "GET" && (typeof args).toLowerCase() == 'object') {
        for (let key in args) {
          let value = args[key];
          result += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      }
      if (result.startsWith("&")) {
        result = result.substring(1)
      }
      return result;
    }),
    getDefaultArgs: (method) => {
      if (method == "GET") {
        return {
          format: 'json'
        }
      } else return {};
    },
    rawPageArrayTo: (rawArray, client) => {
      const pageArray = [];
      for (let raw of rawArray) {
        pageArray.push(new Page(raw, client));
      }
      return pageArray;
    }
  }

  pagehandler = new PageHandler(this);

  set baseURL(value) {
    this._baseURL = value;
  }
  get baseURL() {
    return this._baseURL;
  }
  get util() {
    return this._util;
  }
}

class PageHandler {
  constructor(client) {
    this._client = client;
  }
  add(raw) {
    _pages[raw.pageid] = new Page(raw, this._client);
    return this;
  }
  get(id) {
    return _pages[id];
  }
  _pages = {}
}

class Page {
  constructor(raw, client) {
    this._from(raw);
    this._client = client;
  }
  _from(raw) {
    this.setLastRefreshed();
    for (let key in raw) {
      this[key] = raw[key];
    }
  }
  refreshCategories() {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      _from(await _this.getPageCategories(_this.title, _this.pageid));
      resolve();
    })
  }
  refreshText() {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      _from(await _this.getPageText(_this.title, 'html'));
      resolve();
    })
  }
  refreshInfo() {
    const _this = this;
    return new Promise(async (resolve, reject) => {
      _from(await _this.getPageInfo(_this.title));
      resolve();
    })
  }
  refreshAll() {
    return new Promise(async (resolve, reject) => {
      refreshInfo();
      refreshText();
      await refreshCategories();
      resolve();
    })
  }
  setLastRefreshed() {
    this._lastRefreshed = Date.now();
  }
  get lastRefreshed() {
    return this._lastRefreshed;
  }
}

try {
  module.exports = Client;
} catch(e) {
  try {
    window.MediaWiki = Client;
  } catch(e) {
    try {
      eval('export default Client;');
    } catch (e) {
      throw e;
    }
  }
}
