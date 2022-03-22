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

qx.Class.define("zx.io.persistence.DatabaseController", {
  extend: zx.io.persistence.Controller,

  construct() {
    this.base(arguments, new zx.io.persistence.DatabaseClassIos());
    this.__dirtyObjectUuids = {};
    this.__debounceSaveDirty = new zx.utils.Debounce(() => this._saveDirty(), 250);
    this.__watcher = new zx.io.persistence.Watcher(this.getClassIos());
    this.__watcher.addListener("objectChanged", this.__onObjectChanged, this);
    this.bind("statusFile", this.__watcher, "statusFile");
  },

  properties: {
    /** Status will be periodically saved to this file, if provided */
    statusFile: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeStatusFile"
    }
  },

  members: {
    __dirtyObjectUuids: null,
    __watcher: null,

    /**
     * @Override
     */
    _objectIsReady(obj) {
      this.__watcher.watchObject(obj);
    },

    /**
     * Event handler for when an object becomes dirty
     *
     * @param {qx.event.type.Data} evt
     */
    async __onObjectChanged(evt) {
      let obj = evt.getData();
      let uuid = obj.toUuid();
      this.__dirtyObjectUuids[uuid] = true;
      await this.__debounceSaveDirty.run();
    },

    /**
     * Debounced callback to save all dirty objects
     */
    _saveDirty() {
      let objects = Object.keys(this.__dirtyObjectUuids).map(uuid => this._getKnownObject(uuid));
      objects.forEach(obj => this.__watcher.setObjectChanged(obj, false));
      this.__dirtyObjectUuids = {};
      let endpoints = this.getEndpoints();
      objects.forEach(obj => endpoints.forEach(endpoint => endpoint.put(obj)));
      let status = this.__watcher.getStatusData();
      status.dirtyQueueLastSavedAt = new Date();
    }
  }
});
