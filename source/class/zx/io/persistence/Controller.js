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
 * A Controller manages the import and export between Qooxdoo objects and their
 * JSON equivalent (which could be in a local database or a remote server object)
 */
qx.Class.define("zx.io.persistence.Controller", {
  extend: qx.core.Object,
  type: "abstract",
  implement: [zx.io.persistence.IObjectCache], // Needs to move to Endpoint

  /**
   * Constructor
   * @param {zx.io.persistence.ClassIos} classIos
   */
  construct(classIos) {
    this.base(arguments);
    this.__classIos = classIos;
    this.__endpoints = [];
    this.__endPointsByIndex = {};
    this.__knownObjectsByUuid = {};
    zx.io.persistence.ObjectCaches.getInstance().addCache(this);
  },

  destruct() {
    zx.io.persistence.ObjectCaches.getInstance().removeCache(this);
    this.__endpoints.forEach(endpoint => endpoint.dispose());
    this.__endpoints = this.__endPointsByIndex = null;
  },

  members: {
    __classIos: null,
    __endpoints: null,
    __endPointsByIndex: null,
    __knownObjectsByUuid: null,

    /**
     * Adds a new endpoint; the endpoint will be removed automatically when it closes
     *
     * @param {zx.io.persistence.Endpoint} endpoint the endpoint to add
     */
    addEndpoint(endpoint) {
      this.__endpoints.push(endpoint);
      let index = endpoint.getUniqueIndexId();
      if (index) this.__endPointsByIndex[index] = endpoint;
      let listenerId = endpoint.addListenerOnce("close", () => {
        if (this.isDisposing()) return;
        endpoint.setUserData(this.classname + ".listenerId", null);
        qx.lang.Array.remove(this.__endpoints, endpoint);
        if (index && this.__endPointsByIndex[index] === endpoint) delete this.__endPointsByIndex[index];
      });
      endpoint.setUserData(this.classname + ".listenerId", listenerId);
      endpoint.attachToController(this);
    },

    /**
     * Removes an endpoint from the controller.
     *
     * @param {zx.io.persistence.Endpoint} endpoint the endpoint to remove
     */
    removeEndpoint(endpoint) {
      let index = endpoint.getUniqueIndexId();
      if (index) delete this.__endPointsByIndex[index];
      if (qx.core.Environment.get("qx.debug")) this.assertTrue(qx.lang.Array.contains(this.__endpoints, endpoint));

      qx.lang.Array.remove(this.__endpoints, endpoint);
      let listenerId = endpoint.getUserData(this.classname + ".listenerId");
      if (listenerId) {
        endpoint.setUserData(this.classname + ".listenerId", null);
        endpoint.removeListenerById(listenerId);
      }
      endpoint.detachFromController(this);
    },

    /**
     * Returns the known end points
     *
     * @return {Endpoint[]} list of known, active end points
     */
    getEndpoints() {
      return this.__endpoints;
    },

    /**
     * Tries to find an endpoint; if `query` is a function then it is called for every endpoint, if it is a string
     * then it is assumed to be an index to be looked up
     *
     * @param {Function|String} query
     * @returns {zx.io.remote.NetworkEndpoint?} null if not found
     */
    findEndpoint(query) {
      if (typeof query == "function") return this.__endpoints.find(query) || null;
      return this.__endPointsByIndex[query] || null;
    },

    /**
     * Returns the list of indexes (unique ids) for the endpoints
     *
     * @returns {String[]}
     */
    getEndpointIndexes() {
      return Object.keys(this.__endPointsByIndex);
    },

    /**
     * Loads an object from the data source, but will not complete until all
     * nested objects to be loaded are complete
     *
     * @param uuid {String} the UUID to load
     * @return {qx.core.Object?} the loaded object, null if not found
     */
    async getByUuid(uuid) {
      let p = this.getByUuidNoWait(uuid);
      await this.waitForAll();
      return await p;
    },

    /**
     * Loads an object from the data source, returning a promise and allowing the
     * knownObject queue to build up; if an object is already in the process of being loaded
     * the previous promise is returned.
     *
     * This is used for asynchronous loading of objects, and relied upon by the `ClassRefIo`
     * implementations.
     *
     * NOTE: may return a promise
     *
     * @param uuid {String} the UUID to load
     * @param allowIncomplete {Boolean} if true, allows incomplete objects to be returned
     * @return {qx.core.Object?} the loaded object, null if not found
     */
    getByUuidNoWait(uuid, allowIncomplete) {
      let knownObject = this.__knownObjectsByUuid[uuid];
      if (knownObject) {
        if (knownObject.complete === "error") throw new knownObject.exceptionThrown();
        if (knownObject.complete === "success" || (allowIncomplete && knownObject.obj)) {
          // No way to know if the bject has changed on disk
          if (!knownObject.isStale) return knownObject.obj;

          return zx.utils.Promisify.resolveNow(knownObject.isStale(), stale => {
            // Object has not changed on disk
            if (!stale) return knownObject.obj;

            // Try and reload
            knownObject.isStale = undefined;
            knownObject.complete = undefined;
            knownObject.notified = undefined;
            knownObject.reloading = true;
            return (knownObject.promise = new qx.Promise());
          });
        } else {
          // In progress
          return knownObject.promise;
        }
      } else {
        knownObject = this.__knownObjectsByUuid[uuid] = {
          obj: null,
          promise: new qx.Promise(),
          a: 1
        };
      }

      let data = null;
      let endpoint = null;
      for (let i = 0; !data && i < this.__endpoints.length; i++) {
        endpoint = this.__endpoints[i];
        data = endpoint.getDataFromUuid(uuid);
      }
      if (!data) {
        this.__knownObjectsByUuid[uuid].promise.resolve(null);
        return null;
      }

      return zx.utils.Promisify.resolveNow(data, data => {
        if (!data) {
          this.__knownObjectsByUuid[uuid].promise.resolve(null);
          return null;
        }

        if (data.isStale) knownObject.isStale = data.isStale;

        if (!data.json._classname)
          throw new Error(`Cannot create object with UUID ${uuid} because it does not contain type information`);
        let clz = qx.Class.getByName(data.json._classname);
        if (!clz)
          throw new Error(
            `Cannot create object with UUID ${uuid} because the class ${data.json._classname} does not exist`
          );

        let io = this.__classIos.getClassIo(clz);
        return zx.utils.Promisify.resolveNow(io.fromJson(endpoint, data.json), () => {
          if (knownObject.status == "success") return knownObject.obj;
          return knownObject.promise;
        });
      });
    },

    /**
     * Flushes the queue
     */
    async flush() {
      for (let i = 0; i < this.__endpoints.length; i++) await this.__endpoints[i].flush();
    },

    /**
     * Removes an object
     *
     * @param obj {qx.core.Object} Qooxdoo object to save
     */
    async remove(obj) {
      for (let i = 0; i < this.__endpoints.length; i++) await this.__endpoints[i].remove(obj);
    },

    /**
     * Creates an instance of a class for a given UUID; used by `ClassIo` and `ClassRefIo` to
     * communicate the progress of objects so that recursive/knownObject loading works properly
     *
     * @param clazz {qx.Class} the class to load
     * @param uuid {String} the UUID of the object being created
     * @return {qx.core.Object} the new object instance of `clazz`
     */
    createObject(clazz, uuid) {
      let knownObject = null;
      if (uuid) {
        knownObject = this.__knownObjectsByUuid[uuid];
        if (knownObject && knownObject.obj) {
          if (knownObject.reloading) return knownObject.obj;
          throw new Error(
            `Cannot create an object twice during load for the same uuid (${uuid} for class ${clazz.classname})`
          );
        }
      }

      let obj = new clazz();
      if (uuid) obj.setExplicitUuid(uuid);
      else uuid = obj.toUuid();

      if (qx.Class.hasInterface(clazz, zx.io.persistence.IObjectNotifications)) {
        obj.receiveDataNotification(zx.io.persistence.IObjectNotifications.CREATED, this);
      }

      if (!knownObject) {
        knownObject = this.__knownObjectsByUuid[uuid] = {
          obj: null,
          promise: new qx.Promise()
        };
      }
      knownObject.obj = obj;

      return obj;
    },

    /**
     * Indicates that the object has finished being loaded, although not including any promises
     * which are yet to resolve to populate properties of the object (eg knownObject loads)
     *
     * @param err {Error} the error, if there was one
     * @param obj {qx.core.Object} the object
     * @return {zx.core.Object|Promise<qx.core.Object>}
     */
    setObjectComplete(obj, err) {
      let uuid = obj.toHashCode();
      let knownObject = this.__knownObjectsByUuid[uuid];
      if (!knownObject) {
        uuid = obj.toUuid();
        knownObject = this.__knownObjectsByUuid[uuid];
      }

      if (knownObject) {
        qx.core.Assert.assertFalse(!!knownObject.complete);
        qx.core.Assert.assertTrue(knownObject.obj === obj);

        if (err) {
          this.error(`Error during object initialisation of ${obj} (${obj.classname}): ${err}`);
          knownObject.complete = "error";
          knownObject.exceptionThrown = err;
          knownObject.promise.reject(err);
        } else {
          knownObject.complete = "success";
          knownObject.promise.resolve(obj);
        }
        knownObject.reloading = undefined;

        if (this.isAllComplete()) {
          let result = [];
          Object.values(this.__knownObjectsByUuid).forEach(knownObject => {
            if (!knownObject.notified) {
              if (qx.Class.hasInterface(knownObject.obj.constructor, zx.io.persistence.IObjectNotifications)) {
                knownObject.notified = true;
                let p = knownObject.obj.receiveDataNotification(
                  zx.io.persistence.IObjectNotifications.DATA_LOAD_COMPLETE
                );
                result.push(p);
              }
            }
          });
          return zx.utils.Promisify.allNow(result, () => obj);
        }
        return obj;
      } else {
        qx.core.Assert.assertFalse(true);
      }
    },

    /**
     * Removes all objects from the list of known objects which are complete
     */
    forgetAllComplete() {
      Object.keys(this.__knownObjectsByUuid).forEach(uuid => {
        let knownObject = this.__knownObjectsByUuid[uuid];
        if (!!knownObject.complete) delete this.__knownObjectsByUuid[uuid];
      });
    },

    /**
     * Waits for all objects to finish loading
     */
    async waitForAll() {
      let uuids = Object.keys(this.__knownObjectsByUuid);
      await qx.Promise.all(Object.values(this.__knownObjectsByUuid).map(knownObject => knownObject.promise));
    },

    /**
     * Removes an object from the list of known objects
     *
     * @param obj {qx.core.Object}
     */
    forgetObject(obj) {
      let uuid = obj.toHashCode();
      let knownObject = this.__knownObjectsByUuid[uuid];
      if (!knownObject) {
        let io = this.__classIos.getClassIo(obj.constructor);
        uuid = obj.toUuid();
        knownObject = this.__knownObjectsByUuid[uuid];
      }
      if (knownObject) {
        delete this.__knownObjectsByUuid[uuid];
      }
    },

    /**
     * Detects whether the object is a persistable object, compatible with this type of controller
     *
     * @param {Boolean} obj
     * @returns
     */
    isCompatibleObject(obj) {
      return this.__classIos.isCompatibleObject(obj);
    },

    /**
     * Detects whether all objects are completed
     *
     * @return {Boolean} true if all loaded
     */
    isAllComplete() {
      return !Object.values(this.__knownObjectsByUuid).some(knownObject => !knownObject.complete);
    },

    /**
     * Simopluy returns a known object, if it exists; the object may or may not be completely loaded
     *
     * @param {String} uuid of the obect
     * @returns {qx.core.Object?} null if not known
     */
    _getKnownObject(uuid) {
      return (this.__knownObjectsByUuid[uuid] && this.__knownObjectsByUuid[uuid].obj) || null;
    },

    /**
     * Returns the status of an object
     *
     * @param {String} uuid
     * @returns {String?} the status, null if the UUID is not recognised
     */
    _getKnownObjectStatus(uuid) {
      if (!this.__knownObjectsByUuid[uuid]) return null;
      return this.__knownObjectsByUuid[uuid].complete || "loading";
    },

    /**
     * Addds a known object
     *
     * @param {String} uuid
     * @param {qx.core.Object} object
     */
    _addKnownObject(uuid, object) {
      this.__knownObjectsByUuid[uuid] = {
        obj: object,
        complete: "success"
      };
    },

    /**
     * @Override
     */
    findObjectByUuid(uuid) {
      return this._getKnownObject(uuid);
    },

    /**
     * Returns the ClassIos instance used to detect ClassIo instances
     *
     * @returns {zx.io.persistence.ClassIos}
     */
    getClassIos() {
      return this.__classIos;
    },

    /**
     * Returns the datasources
     *
     * @return {IDataSource[]}
     */
    getDataSources() {
      return this.__endpoints;
    }
  },

  statics: {
    /** `put()` recursively saves objects until there are no more to save; that could cause an infinite
     * loop if there was a bug in one of the objects, and MAX_PUT_PASSES is there to limit that
     */
    MAX_PUT_PASSES: 50
  }
});
