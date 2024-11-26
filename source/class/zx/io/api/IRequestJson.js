/**
 * Tagging interface for the native object that will be sent as a request from a client transport to a server transport
 */
qx.Interface.define("zx.io.api.IRequestJson", {
  members: {
    /**
     * @type {"callMethod" | "subscribe"}
     */
    type: "",
    /**
     * NB: This object is empty when the request is a poll
     *
     * @interface ICallMethod @extends {IBody}
     * @property {any[]} methodArgs
     *
     * @interface ISubscribe @extends {IBody}
     * @property {string} eventName
     *
     * @typedef {ICallMethod | ISubscribe | {}} IBody
     *
     * @type {IBody}
     */
    body: {},

    /**
     * @type {zx.io.api.IHeaders}
     */
    headers: {}
  }
});
