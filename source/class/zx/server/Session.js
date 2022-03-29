const uid = require("uid-safe").sync;
const cookieSignature = require("cookie-signature");

/**
 * Represents a session
 */
qx.Class.define("zx.server.Session", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param {zx.server.SessionManager} manager
   * @param {var?} loadedSessionData
   */
  construct(manager, loadedSessionData) {
    super();
    this.__values = new zx.data.Map();
    this.__manager = manager;
    if (loadedSessionData) {
      this.importSession(loadedSessionData);
    }
    this.touch();
    if (!loadedSessionData?.sessionId) {
      this.regenerate();
    }
  },

  properties: {
    expires: {
      init: null,
      check: "Date",
      event: "changeExpires"
    },

    sessionId: {
      nullable: false,
      check: "String",
      apply: "_applySessionId"
    }
  },

  members: {
    /** @type{zx.data.Map} the values storeed in the session */
    __values: null,

    /** @type{zx.server.SessionManager} the manager */
    __manager: null,

    /** @type{Integer} usage reference count */
    __useCount: null,

    set(key, value) {
      if (value === null || value === undefined) this.__values.remove(key);
      else this.__values.put(key, value);
    },

    get(key, defaultValue) {
      if (!this.__values.containsKey(key)) {
        this.__values.put(key, defaultValue);
        return defaultValue;
      }
      return this.__values.get(key);
    },

    isEmpty() {
      return this.__values.isEmpty();
    },

    hasExpired() {
      let dt = this.getExpires();
      return dt && dt <= Date.now();
    },

    addUse() {
      this.__useCount++;
    },

    decUse() {
      this.__useCount--;
    },

    isInUse() {
      return this.__useCount > 0;
    },

    touch() {
      let options = this.__manager.getCookieOptions();
      if (options.maxAge) {
        let dt = new Date(Date.now() + options.maxAge);
        this.setExpires(dt);
      }
    },

    _applySessionId(value) {
      this.__encryptedSessionId = cookieSignature.sign(value, this.__manager.getSecret());
    },

    getEncryptedSessionId() {
      return this.__encryptedSessionId;
    },

    regenerate() {
      this.setSessionId(uid(24));
    },

    importSession(data) {
      if (data.sessionId) this.setSessionId(data.sessionId);
      this.setExpires(data.expires || null);
      this.__values.replace(data.values);
    },

    exportSession() {
      return {
        sessionId: this.getSessionId(),
        expires: this.getExpires(),
        values: this.__values.toObject()
      };
    },

    getCookieConfiguration(secureConnection) {
      let cookieOptions = this.__manager.getCookieOptions();
      let secure = cookieOptions.secure;
      let sameSite = cookieOptions.sameSite;
      if (secure === "auto") {
        if (secureConnection === true) {
          secure = true;
        } else {
          sameSite = "Lax";
          secure = false;
        }
      } else {
        secure = this.secure;
      }

      return {
        path: cookieOptions.path || "/",
        httpOnly: cookieOptions.httpOnly !== undefined ? cookieOptions.httpOnly : true,
        secure: cookieOptions.secure,
        expires: this.getExpires() || cookieOptions.expires || new Date(Date.now() + cookieOptions.maxAge),
        sameSite,
        domain: cookieOptions.domain
      };
    }
  }
});
