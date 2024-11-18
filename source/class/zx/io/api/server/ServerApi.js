qx.Class.define("zx.io.api.server.ServerApi", {
  extend: qx.core.Object,

  construct(apiName) {
    super();
    this.__apiName = apiName;
  },

  members: {
    getApiName() {
      return this.__apiName;
    },

    receiveMessage(request, response) {
      response.header["Client-Api-Uuid"] = request.header["Api-Uuid"];
      let method = request.header["Method"];
      let sessionUuid = request.header["Session-Uuid"];
      if (sessionUuid) {
        let session = zx.io.api.server.SessionManager.getInstance().getSessionByUuid(sessionUuid);
        if (session) {
          session.setLastActivity(new Date());
          response.addHeader("Session-Uuid", session.toUuid());
        }
      }

      if (method == "call") {
        this._callMethod(request, response);
      } else if (method == "subscribe") {
        this._subscribe(request, response);
      }
    },

    async _callMethod(request, response) {
      let result = undefined;
      let error = undefined;
      let methodArgs = request.body.methodArgs;
      try {
        result = await this[request.path].apply(this, methodArgs);
      } catch (ex) {
        error = ex;
      }
      response.setResponse({
        type: "return",
        headers: [
          "Call-Index: " + request.header["Call-Index"] //
        ],
        body: {
          methodResult: result,
          error
        }
      });
    },

    _subscribe(request, response) {
      let eventName = request.body.eventName;
      let session = zx.io.api.server.SessionManager.getInstance().getSessionByUuid(request.header["Client-Api-Uuid"]);
      if (!session) {
        session = new zx.io.api.server.Session(this, request.transport);
        zx.io.api.server.SessionManager.getInstance().addSession(session);
      }
      session.addSubscription(eventName);
      response.addHeader("Session-Uuid", session.toUuid());
    },

    publish(eventName, data) {
      zx.io.api.server.SessionManager.getInstance()
        .getSessionsForApi(api.getApiName())
        .forEach(session => session.publish(eventName, data));
    }
  }
});
