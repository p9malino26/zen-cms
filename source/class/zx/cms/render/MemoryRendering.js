/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

const path = require("upath");

/**
 * Allows rendering to memory, used for testing
 */
qx.Class.define("zx.cms.render.MemoryRendering", {
  extend: zx.cms.render.AbstractRendering,

  construct(query, headers) {
    super();
    this.__query = query || {};
    this.__headers = headers || {};
    this.__responseHeaders = {};
  },

  members: {
    __query: null,
    __headers: null,

    __statusCode: 200,
    __statusMessage: null,
    __body: null,
    __srcFilename: null,
    __responseHeaders: null,

    /*
     * @Override
     */
    getHeader(name) {
      return this.__headers[name] || null;
    },

    /*
     * @Override
     */
    getQuery() {
      return this.__query;
    },

    /*
     * @Override
     */
    getUser() {
      return null;
    },

    /*
     * @Override
     */
    setStatus(statusCode, message) {
      this.__statusCode = statusCode;
      this.__statusMessage = message || null;
    },

    /*
     * @Override
     */
    setResponseHeader(key, value) {
      if (value === null || value === undefined) {
        delete this.__responseHeaders[key];
      } else this.__responseHeaders[key] = value;
    },

    /*
     * @Override
     */
    async send(body) {
      this.__body = body;
    },

    /*
     * @Override
     */
    async sendFile(filename, options) {
      if (options && options.root) {
        this.__srcFilename = path.resolve(options.root, filename);
      } else {
        this.__srcFilename = path.resolve(filename);
      }
    },

    /**
     * Gets all response headers
     *
     * @return {Map<String, String>}
     */
    getResponseHeaders() {
      return this.__responseHeaders;
    },

    /**
     * Gets the status code, defaults to 200
     *
     * @return {Integer}
     */
    getStatusCode() {
      return this.__statusCode;
    },

    /**
     * Gets the status message, null if one was not set
     *
     * @return {String?}
     */
    getStatusMessage() {
      return this.__statusMessage;
    },

    /**
     * Gets the body
     *
     * @return {String|Buffer|Object?} the body, or null
     */
    getBody() {
      return this.__body;
    },

    /**
     * Gets the filename to get the body response from
     *
     * @return {String|Buffer|Object?} the body, or null
     */
    getSrcFilename() {
      return this.__srcFilename;
    }
  }
});
