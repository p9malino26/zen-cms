qx.Class.define("zx.io.api.client.ClientApi", {
  extend: qx.core.Object,

  construct(transport, apiName, methodNames) {
    super();
    this.__transport = transport;
    this.__apiName = apiName;
    this.__cookies = {};
    this.__pendingMethodCalls = {};
    this.__transport.addListener("message", this._onMessage, this);

    if (methodNames) {
      if (qx.lang.Type.isArray(methodNames)) {
        methodNames.forEach(methodName => this._addMethod(methodName));
      } else {
        for (let methodName in methodNames) {
          this._addMethod(methodName, methodNames[methodName]);
        }
      }
    }
  },

  members: {
    __transport: null,
    __pendingMethodCalls: null,
    __pendingMethodCallIndex: 0,
    __cookies: null,

    getApiName() {
      return this.__apiName;
    },

    /**
     * Adds a remote method
     *
     * @param {String} methodName
     * @param {Object} methodConfig
     */
    _addMethod(methodName, methodConfig) {
      if (typeof methodName != "string" && !methodConfig && typeof methodName.methodName == "string") {
        methodConfig = methodName;
        methodName = methodConfig.methodName;
      } else {
        methodConfig = methodConfig || {};
        methodConfig.methodName = methodName;
      }
      this.__methodConfigs[methodName] = methodConfig || {};
      this[methodName] = (...args) => this._callMethod(methodName, args);
    },

    _callMethod(methodName, methodArgs) {
      let promise = new qx.Promise();
      let pending = {
        promise,
        callIndex: ++this.__pendingMethodCallIndex,
        methodName,
        methodArgs
      };
      this.__pendingMethodCalls[pending.callIndex] = pending;
      this.__transport.postMessage({
        headers: [
          "Method: call",
          "Call-Index: " + pending.callIndex, //
          "Api-Name: " + this.__apiName,
          "Api-Uuid: " + this.toUuid(),
          "Cookies: " + JSON.stringify(this.__cookies)
        ],
        path: methodName,
        body: {
          methodArgs
        }
      });
      return promise;
    },

    _onMessage(evt) {
      let arrData = evt.getData();
      for (let data of arrData) {
        let newCookies = data.headers["Cookies"];
        if (newCookies) {
          for (let cookie of newCookies) {
            if (cookie.delete === true) {
              delete this.__cookies[cookie];
            } else {
              this.__cookies[cookie] = cookie;
            }
          }
        }

        if (data.type == "return") {
          let callIndex = data.headers["Call-Index"];
          if (!callIndex) {
            this.error("No CallIndex in return message");
          }
          let pending = this.__pendingMethodCalls[callIndex];
          if (pending) {
            delete this.__pendingMethodCalls[callIndex];
            if (data.body.error) {
              pending.promise.reject(data.body.error);
            } else {
              pending.promise.resolve(data.body.result);
            }
          }
        } else if (data.type == "publish") {
          this.fireDataEvent(data.eventName, data.body || null);
        } else {
          this.error("Unexpected message type: " + data.type);
        }
      }
    },

    subscribe(eventName) {
      this.__transport.postMessage({
        headers: [
          "Method: subscribe", //
          "Api-Name: " + this.__apiName,
          "Api-Uuid: " + this.toUuid()
        ],
        path: eventName
      });
    }
  }
});
