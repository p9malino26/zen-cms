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

qx.Class.define("zx.io.persistence.Endpoint", {
  extend: qx.core.Object,

  construct() {
    this.base(arguments);
    this.__changingProperties = {};
  },

  destruct() {
    this.__controller = null;
    this.__availableJson = this.__putDependentObjects = this.__putQueueDoneObjects = null;
    this.__controller = null;
  },

  events: {
    /** Fired when the endpoint is opened */
    open: "qx.event.type.Event",

    /** Fired when the end point is closed */
    close: "qx.event.type.Event"
  },

  members: {
    /** @type{zx.io.persistence.Controller} the attached controller */
    __controller: null,

    /** @type{Map} available JSON indexed by uuid */
    __availableJson: null,

    /** @type{Integer} recursion count for `put()` */
    __inPut: 0,

    /** @type{Map} list of dependent objects that need to be sent in the next flush, indexed by uuid */
    __putDependentObjects: null,

    /** @type{Map} properties being changed, the key is "uuid:propertyName" the value is the recursion count */
    __changingProperties: null,

    /**
     * Sets the controller
     *
     * @param {zx.io.persistence.Controller} controller the controller to attach
     */
    attachToController(controller) {
      this.__controller = controller;
    },

    /**
     * Detaches from the controller
     */
    detachFromController() {
      this.__controller = null;
    },

    /**
     * Returns a unique key that can be used to lookup this endpoint from the controller, typically
     * this would be (for example) a session ID, and is specific to the implementation.  If this returns
     * null, then that's allowed but it just means that it cannot be found by indexing.
     *
     * Note that this needs to be unique across all implementations - a good way of ensuring this could be
     * to prefix a session id with a class name, for example.
     *
     * @return {String?} the indexing ID
     */
    getUniqueIndexId() {
      return null;
    },

    /**
     * Returns JSON data for a given UUID.  This is used to allow the deserialisation mechanisms to resolve
     * UUID into JSON recursively; the implementation will be able to pull out the JSON on demand.
     *
     * NOTE:: may return a promise
     *
     * @typedef {Object} DataFromUuid
     * @property {Object} json the JSON data
     * @property {Long} mtime the modification time epoch
     * @property {Function} isStale a function to call to determine if the data is out of date (which can return a promise)
     *
     * @param {String} uuid
     * @return {DataFromUuid}
     */
    async getDataFromUuid(uuid) {
      throw new Error(`No such implementation for ${this.classname}.getDataFromUuid`);
    },

    /**
     * Returns JSON for a given query; this is not required to be implemented and should return undefined if the
     * endpoint does not support it; typically this is used to allow hand-coded database references, instead of
     * refering by UUID and classname.  This implies that network endpoints are definitely not to support
     * it, but it is useful for database endpoints to support it.
     *
     * @param {*} query POJO with a query for the database
     * @param {*?} projection the projection of fields to return
     * @return {*} POJO with data, or null if not found, or undefined if not implemented
     */
    async getDataFromQuery(query, projection) {
      return undefined;
    },

    /**
     * Saves an object; an uuid will be assigned if not already provided, otherwise the
     * UUID is assumed to exist and the current record will be updated
     *
     * @param obj {qx.core.Object} Qooxdoo object to save
     * @return {String} UUID of the data
     */
    async put(obj) {
      this.grabPutQueue();
      try {
        await this._putImpl(obj);
      } finally {
        await this.releasePutQueue();
      }
    },

    /**
     * Implements `put`
     *
     * @param obj {qx.core.Object} the Qooxdoo object to put
     */
    async _putImpl(obj) {
      let io = this.__controller.getClassIos().getClassIo(obj.constructor);
      let json = await io.toJson(this, obj);
      json._classname = obj.classname;
      let uuid = obj.toUuid();
      json._uuid = uuid;
      this.__controller._addKnownObject(uuid, obj);

      await this._sendJson(uuid, json);
      let uuidNow = obj.toUuid();
      if (uuidNow && uuid != uuidNow) throw new Error(`UUID changed from ${uuid} to ${uuidNow} while saving`);
      if (!this.__putQueueDoneObjects) this.__putQueueDoneObjects = {};
      this.__putQueueDoneObjects[uuid] = true;
    },

    async _sendJson(uuid, json) {
      throw new Error(`No such implementation for ${this.classname}._sendJson`);
    },

    /**
     * Grabs the put queue; this is a reference counting mechanism to allow code to suppress
     * flushing of the put queue and must be matched by a call to `releasePutQueue`.  Calls to
     * grab/releasePutQueue may be nested
     */
    grabPutQueue() {
      this.__inPut++;
    },

    /**
     * Releases the put queue after a call to `grabPutQueue`; the last release will trigger flushing
     * the queue to the other sides
     */
    async releasePutQueue() {
      try {
        if (this.__inPut === 1) {
          await this.__clearPutQueueDependentObjects();
          await this.flush();
        }
      } finally {
        this.__inPut--;
      }
    },

    /**
     * Takes the list of dependent objects and puts them; each put can cause the dependent objects list
     * to increase again, so this continues until no more dependent objects are added
     */
    async __clearPutQueueDependentObjects() {
      const scanForMore = async () => {
        if (!this.__putDependentObjects) return false;
        let uuids = Object.keys(this.__putDependentObjects);
        let didWork = false;
        for (let i = 0; i < uuids.length; i++) {
          let uuid = uuids[i];
          if (!this.__putQueueDoneObjects || !this.__putQueueDoneObjects[uuid]) {
            await this._putImpl(this.__putDependentObjects[uuid]);
            didWork = true;
          }
        }
        return didWork;
      };
      let passes = 0;
      while (await scanForMore()) {
        passes++;
        if (passes > zx.io.persistence.Controller.MAX_PUT_PASSES)
          throw new Error(`Failed to save because putQueue produces an endless stream of changes`);
      }
    },

    /**
     * Called to notify the put method about objects which are referenced by the top-most
     * object being put
     *
     * @param obj {qx.core.Object} the dependent object
     */
    putDependentObject(obj) {
      let io = this.__controller.getClassIos().getClassIo(obj.constructor);
      let uuid = obj.toUuid();

      if (!this.__putDependentObjects) this.__putDependentObjects = {};
      if (this.__putDependentObjects[uuid] && this.__putDependentObjects[uuid] !== obj)
        throw new Error(`Unexpected change in UUID discovered for ${uuid}: ${obj}`);
      if (this.__controller._getKnownObject(uuid)) {
        qx.core.Assert.assertTrue(this.__controller._getKnownObjectStatus(uuid) === "success");
      } else {
        this.__controller._addKnownObject(uuid, obj);
      }
      this.__putDependentObjects[uuid] = obj;
    },

    /**
     * Flushes the queue
     */
    async flush() {
      if (this.__putDependentObjects) {
        await this.__clearPutQueueDependentObjects();
      }
      this.__putQueueDoneObjects = null;
      this.__putDependentObjects = null;
    },

    beginChangingProperty(obj, propertyName) {
      let uuid = obj.toUuid();
      let key = uuid + ":" + propertyName;
      let count = this.__changingProperties[key] || 0;
      this.__changingProperties[key] = count + 1;
    },

    endChangingProperty(obj, propertyName) {
      let uuid = obj.toUuid();
      let key = uuid + ":" + propertyName;
      if (this.__changingProperties[key] !== undefined) {
        let count = this.__changingProperties[key];
        count--;
        if (count == 0) delete this.__changingProperties[key];
        else this.__changingProperties[key] = count;
      }
    },

    isChangingProperty(obj, propertyName) {
      let uuid = obj.toUuid();
      let key = uuid + ":" + propertyName;
      return this.__changingProperties[key] !== undefined;
    },

    /**
     * @Override
     */
    createUuid() {
      let uuid = qx.util.Uuid.createUuidV4();
      return uuid;
    },

    /**
     * @returns the controller this endpoint is attached to
     */
    getController() {
      return this.__controller;
    }
  }
});
