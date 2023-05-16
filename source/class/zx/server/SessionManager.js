const cookieSignature = require("cookie-signature");

/**
 * Implements session handling for Fastify.
 *
 * The stock fastify session handler is broken because it will not handle overlapping requests
 * properly - it will load/save the session from the store for every request, but this means that
 * if you have multiple overlapping requests for the same session, then you can get 2 loads, two
 * modifications to the session, and then two stores - meaning that the first set of session changes
 * is overwritten.
 */
qx.Class.define("zx.server.SessionManager", {
  extend: qx.core.Object,

  construct(uri, databaseName, collectionName) {
    super();
    this.__uri = uri;
    this.__databaseName = databaseName;
    this.__collectionName = collectionName;
    this.__sessionCache = {};
  },

  properties: {
    /** Encryption used for sending session Ids in cookies */
    secret: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Name of the cookie to use */
    cookieName: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Options for the cookie */
    cookieOptions: {
      init: {
        maxAge: 5 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        // This needs to be false unless on HTTPS (otherwise cookies will not be sent by @fastify/session)
        secure: false //sessionConfig.secureCookie === false ? false : true
      },
      nullable: false
    }
  },

  members: {
    /** @type{String} the URI of the database to connect to */
    __uri: null,

    /** @type{String} the name of the database */
    __databaseName: null,

    /** @type{String} the name of the collection */
    __collectionName: null,

    /** @type{MongoClient} the Mongo client instance */
    __mongo: null,

    /** @type{MongoClient.DB} the Mongo database */
    __db: null,

    /** @type{Boolean} true if it is a new database */
    __newDatabase: false,

    /** @type{MongoClient.Collection} the Mongo collection */
    __collection: null,

    /** @type{Map<String,zx.server.Session} cache of sessions, indexed by sessionId */
    __sessionCache: null,

    /**
     * Opens the database connection
     */
    async open() {
      const { MongoClient } = require("mongodb");
      this.__mongo = new MongoClient(this.__uri);
      await this.__mongo.connect();
      this.__db = this.__mongo.db(this.__databaseName);
      let collections = await this.__db.collections();
      let exists = collections.find(coll => coll.collectionName == this.__collectionName);
      this.__newDatabase = !exists;
      this.__collection = this.__db.collection(this.__collectionName);

      await this.deleteExpiredSessions();
    },

    /**
     * Closes the database connection
     */
    async close() {
      if (this.__mongo) {
        this.__mongo.close();
        this.__mongo = null;
        this.__db = null;
        this.__collection = null;
      }
    },

    /**
     * Creates a new session and replaces whatever is there
     *
     * @param {Fastify.Request} request
     * @returns {zx.server.Session} the new session
     */
    newSession(request) {
      this.clearSession(request);
      request.session = new zx.server.Session(this, null);
      request.session.addUse();
      return request.session;
    },

    /**
     * Clears the session and deletes it from the database
     *
     * @param {Fastify.Request} request
     * @returns {zx.server.Session} the new session
     */
    async disposeSession(request) {
      if (request.session) {
        let sessionId = request.session.getSessionId();
        request.session = null;
        delete this.__sessionCache[sessionId];
        await this.__collection.deleteOne({ sessionId });
      }
    },

    /**
     * Clears the session from the request, without actually deleting it
     *
     * @param {Fastify.Request} request
     */
    clearSession(request) {
      if (request.session) {
        let sessionId = request.session.getSessionId();
        request.session.decUse();
        if (!request.session.isInUse()) {
          delete this.__sessionCache[sessionId];
        }
        request.session = null;
      }
    },

    /**
     * Deletes expired sessions
     */
    async deleteExpiredSessions() {
      await this.__collection.deleteMany({ expires: { $lt: new Date() } });
    },

    /**
     * onRequest Hook
     *
     * @param {Fastify.Request} request
     * @param {Fastify.Reply} reply
     */
    async _onRequest(request, reply) {
      let cookieOptions = this.getCookieOptions();

      let url = request.raw.url;
      if (url.indexOf(cookieOptions.path || "/") !== 0) {
        return;
      }

      let encryptedSessionId = request.cookies[this.getCookieName()];
      let sessionId = encryptedSessionId ? cookieSignature.unsign(encryptedSessionId, this.getSecret()) : null;
      if (!sessionId) {
        this.newSession(request);
        return;
      }

      request.session = this.__sessionCache[sessionId] || null;
      if (!request.session) {
        let json = await this.__collection.findOne({ sessionId });
        request.session = this.__sessionCache[sessionId] || null;
        if (!request.session) {
          request.session = this.__sessionCache[sessionId] = new zx.server.Session(this, json);
        }
      }

      request.session.addUse();

      if (request.session.hasExpired()) {
        await this.disposeSession(request);
        this.newSession(request);
      }
    },

    /**
     * onSend Hook
     *
     * @param {Fastify.Request} request
     * @param {Fastify.Reply} reply
     * @param {var} payload
     */
    async _onSend(request, reply, payload) {
      const session = request.session;
      if (!session || !session.getSessionId() || !this.__shouldSaveSession(request)) {
        return;
      }

      let json = session.exportSession();
      await this.__collection.replaceOne({ sessionId: session.getSessionId() }, json, { upsert: true });
      reply.setCookie(
        this.getCookieName(),
        session.getEncryptedSessionId(),
        session.getCookieConfiguration(this.__isConnectionSecure(request))
      );
    },

    /**
     * onResponse Hook
     *
     * @param {Fastify.Request} request
     * @param {Fastify.Reply} reply
     */
    async _onResponse(request, reply) {
      const session = request.session;
      if (!session) return;
      request.session.decUse();
      if (!request.session.isInUse()) {
        delete this.__sessionCache[request.session.getSessionId()];
      }
    },

    /**
     * Test for whether the session should be persisted
     *
     * @param {Fastify.Request} request
     * @returns {Boolean}
     */
    __shouldSaveSession(request) {
      let cookieOptions = this.getCookieOptions();
      if (request.session.isEmpty()) {
        return false;
      }
      if (cookieOptions.secure !== true || cookieOptions.secure === "auto") {
        return true;
      }
      if (this.__isConnectionEncrypted(request)) {
        return true;
      }
      const forwardedProto = this.__getRequestProto(request);
      return forwardedProto === "https";
    },

    /**
     * Gets the protocol
     *
     * @param {Fastify.Request} request
     * @returns {Boolean}
     */
    __getRequestProto(request) {
      return request.headers["x-forwarded-proto"] || "http";
    },

    /**
     * Test for whether the connection is secure
     *
     * @param {Fastify.Request} request
     * @returns {Boolean}
     */
    __isConnectionSecure(request) {
      if (this.__isConnectionEncrypted(request)) {
        return true;
      }
      return this.__getRequestProto(request) === "https";
    },

    /**
     * Test for whether the connection is encrypted
     *
     * @param {Fastify.Request} request
     * @returns {Boolean}
     */
    __isConnectionEncrypted(request) {
      const socket = request.raw.socket;
      return socket && socket.encrypted === true;
    },

    /**
     * Connects this to Fastify as a plugin
     *
     * @param {Fastify} fastify
     */
    registerWithFastify(fastify) {
      fastify.decorateRequest("session", null);
      fastify.addHook("onRequest", async (request, reply) => await this._onRequest(request, reply));
      fastify.addHook("onSend", async (request, reply, payload) => await this._onSend(request, reply, payload));
      fastify.addHook("onResponse", async (request, reply) => await this._onResponse(request, reply));
    }
  }
});
