/**
 * Model class representing a request to the server,
 * Requests can be to subscribe to server events, or to call a method on the server
 * They are created by the transport class when a message is received from the client
 */
qx.Class.define("zx.io.api.server.Request", {
  extend: qx.core.Object,

  /**
   * @param {zx.io.api.server.IServerTransport} transport The transport that received the message and created this request
   * @param {zx.io.api.IRequestJson?} data The raw JSON message that this request is based on
   */
  construct(transport, data) {
    super();
    this.set({ transport: transport });
    this.initQuery({});

    let properties = {
      headers: {},
      type: "callMethod"
    };

    if (data) {
      properties.headers = data.headers ? qx.lang.Object.clone(data.headers) : {};
      properties.body = data.body;
      properties.path = data.path ?? null;
      properties.type = data.type;
    }

    this.set(properties);

    let sessionUuid = this.getHeader("Session-Uuid");
    if (sessionUuid) {
      let session = zx.io.api.server.SessionManager.getInstance().getSessionByUuid(sessionUuid);
      if (session) {
        session.setLastActivity(new Date());
        this.setSession(session);
      }
    }
  },

  properties: {
    /**
     * public readonly
     */
    type: {
      check: ["callMethod", "subscribe", "poll", "unsubscribe"],
      init: null
    },
    /**
     * public readonly.
     * The transport that created this request
     */
    transport: {
      init: null,
      check: "zx.io.api.server.IServerTransport"
    },

    /**
     * public readonly.
     * Only set when this request's type is "callMethod".
     * Sometimes it may be a forward-slash-separated string, e.g. "/prefix/apiName/methodName",
     * or it can be just a string, which is the method name
     */
    path: {
      init: null,
      nullable: true,
      check: "String"
    },

    /**
     * public readonly.
     * If this request is part of a session, this property will be set to the session object
     */
    session: {
      init: null,
      nullable: true,
      check: "zx.io.api.server.Session"
    },

    /**
     * public readonly
     * @type {zx.io.api.IHeaders}
     */
    headers: {
      check: "Object"
    },

    /**
     * @type {zx.io.api.IRequestJson.IBody}
     * public readonly
     */
    body: {
      init: null,
      nullable: true
    },

    query: {
      nullable: true,
      check: "Object",
      deferredInit: true
    },

    restMethod: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    /**
     * Makes sure that a session exists; if it already exists, nothing happens
     *
     * @return {zx.io.api.Session}
     */
    createSession() {
      let session = this.getSession();
      if (session) {
        return session;
      }

      let sessionUuid = this.getHeader("Session-Uuid");
      if (sessionUuid) {
        session = zx.io.api.server.SessionManager.getInstance().getSessionByUuid(sessionUuid);
      }

      if (!session) {
        session = new zx.io.api.server.Session(this.getTransport());
        zx.io.api.server.SessionManager.getInstance().addSession(session);
      }
      return session;
    },

    getHeader(key) {
      return this.getHeaders()[key];
    }
  }
});
