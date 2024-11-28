/**
 * Tagging interface for the headers POJO that is sent with every request and response
 */
qx.Interface.define("zx.io.api.IHeaders", {
  members: {
    /**
     * @type {number}
     * An ID for a method call
     * Used for requests of type "callMethod" and responses of type "methodReturn"
     */
    "Call-Index": 0,
    /**
     * Name of the API
     * Not used for poll requests/responses
     */
    "Api-Name": "",
    "Client-Api-Uuid": "",
    "Server-Api-Uuid": "",
    /**
     * @type {Object}
     */
    Cookies: {},
    "Session-Uuid": ""
  }
});
