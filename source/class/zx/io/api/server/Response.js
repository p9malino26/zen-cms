/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * Model class representing a response to a request to the server,
 * They are created by the transport class when a message is received from the client
 */
qx.Class.define("zx.io.api.server.Response", {
  extend: qx.core.Object,
  construct() {
    super();
    this.__data = [];
    this.setHeaders({});
  },
  properties: {
    /**
     * public readonly
     * @type {zx.io.api.IHeaders}
     */
    headers: {
      check: "Object"
    },

    /**
     * Any error message that occurred while processing the request
     */
    error: {
      check: "String",
      init: null,
      nullable: true
    }
  },
  members: {
    /**
     * The data items of this response
     * @type {zx.io.api.IResponseJson.IResponseData[]}
     */
    __data: null,

    /**
     *
     * @returns {zx.io.api.IResponseJson.IResponseData[]}
     */
    getData() {
      return this.__data;
    },

    /**
     *
     * @param {zx.io.api.IResponseJson.IResponseData} data
     */
    addData(data) {
      this.__data.push(data);
    },

    addHeader(key, value) {
      this.getHeaders()[key] = value;
    },

    addHeaders(headers) {
      for (let key in headers) {
        this.addHeader(key, headers[key]);
      }
    },

    /**
     * @returns {zx.io.api.IResponseJson}
     */
    toNativeObject() {
      return {
        data: this.__data
      };
    }
  }
});
