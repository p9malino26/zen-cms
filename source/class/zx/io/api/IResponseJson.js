/**
 * Tagging interface for response data from the server back to the client
 */
qx.Interface.define("zx.io.api.IResponseJson", {
  members: {
    /**
     * An array of data for the response, which can be returns of method calls,
     * or subscrption acknowledgements
     *
     * @interface IResponseData
     * @property {zx.io.api.IHeaders} headers
     * @property {string} type
     * @property {Object} body
     *
     * @interface IMethodReturn @extends IResponseData
     * @property {"methodReturn"} type
     * @property {{methodResult: any, error: any}} body
     * @property {{"Call-Index": number}} headers
     *
     * @interface IPublish @extends IResponseData
     * @property {"publish"} type
     * @property {{eventName: string, eventData: any}} body
     *
     * @interface ISubscribed @extends IResponseData
     * @property {"subscribed"} type
     * @property {{eventName: string}} body
     *
     * @interface IUnsubscribed @extends IResponseData
     * @property {"unsubscribed"} type
     * @property {{eventName: string}} body
     *
     * @type {IResponseData[]}
     */
    data: []
  }
});
