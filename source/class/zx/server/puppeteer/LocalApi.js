/**
 * Defines a Local API, ie a class with methods that can be called from the HeadlessPage
 */
qx.Class.define("zx.server.puppeteer.LocalApi", {
  extend: qx.core.Object,

  construct(methodMap) {
    super();
    this.__methodMap = methodMap || null;
  },

  members: {
    __methodMap: null,

    callMethod(name, ...args) {
      let methodName = null;
      if (this.__methodMap) {
        methodName = this.__methodMap[name];
      }
      if (!methodName) {
        methodName = "_api" + qx.lang.String.firstUp(name);
      }
      let fn = this[methodName];
      if (typeof fn != "function") {
        throw new Error(`Cannot find API method ${name}`);
      }
      return fn.call(this, ...args);
    }
  }
});
