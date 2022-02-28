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


/**
 * Controller for serialisation to network
 */
qx.Class.define("zx.io.remote.NetworkController", {
  extend: zx.io.persistence.Controller,

  /**
   * Constructor
   *
   * @param {zx.io.remote.NetworkDataSource} datasource
   */
  construct(datasource) {
    this.base(arguments, new zx.io.remote.NetworkClassIos(), datasource);
    this.__uris = {};
    this.__pendingUriPromises = {};
  },

  events: {
    uriMapping: "qx.event.type.Data"
  },

  members: {
    /** @type{Map} all URI mappings */
    __uris: null,

    /** @type{Map<String,qx.Promise>} promises waiting to be fulfilled when a URI arrives */
    __pendingUriPromises: null,

    /**
     * Called when a URI mapping is received from the other side
     *
     * @param {String} uri
     * @param {zx.io.persistence.IObject} object
     */
    receiveUriMapping(uri, object) {
      if (!object) delete this.__uris[uri];
      else this.__uris[uri] = object;
      this.fireDataEvent("uriMapping", { uri, object });

      if (this.__pendingUriPromises[uri]) {
        let promise = this.__pendingUriPromises[uri];
        delete this.__pendingUriPromises[uri];
        promise.resolve(object);
      }
    },

    /**
     * Called to get an object via a given URI
     *
     * @param {String} uri
     * @returns {zx.io.persistence.IObject}
     */
    getUriMapping(uri) {
      return this.__uris[uri] || null;
    },

    /**
     * Returns an object when the URI arrives
     *
     * @param {String} uri
     * @returns {Promise<zx.io.persistence.IObject>}
     */
    getUriMappingAsync(uri) {
      let object = this.getUriMapping(uri);
      if (object !== null) return qx.Promise.resolve(object);
      let promise = this.__pendingUriPromises[uri];
      if (!promise) promise = this.__pendingUriPromises[uri] = new qx.Promise();
      return promise;
    },

    /**
     * Called to send a URI mapping to the other side
     *
     * @param {String} uri
     * @param {zx.io.persistence.IObject} object
     */
    async putUriMapping(uri, object) {
      if (!object) delete this.__uris[uri];
      else this.__uris[uri] = object;
      for (let arr = this.getDataSources(), i = 0; i < arr.length; i++)
        arr[i].putUriMapping(uri, object);
    },

    /**
     * Returns all URI mappings
     * @returns {Map}
     */
    getUriMappings() {
      return this.__uris;
    }
  }
});
