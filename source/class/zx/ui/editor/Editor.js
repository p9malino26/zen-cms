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

qx.Class.define("zx.ui.editor.Editor", {
  extend: qx.ui.core.Widget,
  implement: [zx.ui.editor.IMasterValueAccessor],

  destruct() {
    this.setMasterValueAccessor(null);
    this.setEntity(null);
    this.setValue(null);
    if (this.__entities) {
      Object.values(this.__entities).forEach(entity =>
        entity.removeListener("changeModified", this.__onEntityChangeModified, this)
      );
      this.__entities = null;
    }
  },

  properties: {
    /**
     * IMasterValueAccessor provides access to the master value
     */
    masterValueAccessor: {
      init: null,
      nullable: true,
      check: "zx.ui.editor.IMasterValueAccessor",
      event: "changeMasterValueAccessor",
      apply: "_applyMasterValueAccessor"
    },

    /**
     * Entity that matches the value object
     */
    entity: {
      init: null,
      nullable: true,
      check: "zx.ui.editor.SubEntity",
      event: "changeEntity",
      apply: "_applyEntity"
    },

    /** Whether editable */
    editable: {
      init: true,
      nullable: false,
      check: "Boolean",
      event: "changeEditable",
      apply: "_applyEditable"
    },

    /** Whether modified */
    modified: {
      init: true,
      nullable: false,
      check: "Boolean",
      event: "changeModified",
      apply: "_applyModified"
    },

    /** Whether to autosave */
    autoSave: {
      check: "Boolean",
      init: true,
      nullable: false,
      event: "changeAutoSave",
      apply: "_applyAutoSave"
    }
  },

  events: {
    /** Fired for psuedo property `value` */
    changeValue: "qx.event.type.Data",

    /**
     * Fired to save the value, can be cancelled to prevent the default save behaviour but in which case the
     * "save" is still expected to have completed successfully (ie cancel the event to indicate that the event
     * handler already did the save itself and the editor should not attempt to save; the editor will still update
     * the modified status to `false`).  Data is the value of this editor.
     */
    saveValue: "qx.event.type.Data"
  },

  members: {
    /** @type{Boolean} set to true if this editor is for a master value, false if is is for subentities */
    _masterValueEditor: true,

    /** @type{*} the psuedo property `value` */
    __value: null,

    /** @type{Boolean} true if setValue is in progress */
    __inSetValue: false,

    /** @type{qx.Promise} the promise of the currently running setValue, if any */
    __setValuePromise: null,

    /** @type{Map<String,zx.ui.editor.SubEntity} all known sub entities, indexed by hash code */
    __entities: null,

    /**
     * Getter for psuedo property `value`
     *
     * @return {*} the value
     */
    getValue() {
      return this.__value;
    },

    /**
     * Setter for psuedo property `value`
     *
     * @param {*} the value
     */
    async setValue(value) {
      const setValueImpl = async () => {
        if (qx.Promise.isPromise(value)) {
          value = await value;
        }

        if (value === this.__value) {
          return;
        }

        if (this.__inSetValue) {
          throw new Error(`Already setting value for ${this}, cannot setValue recursively`);
        }

        this.__inSetValue = true;
        try {
          if (this.isAutoSave() && this.isModified() && this.getMasterValue() === this.getValue()) {
            await this.save();
          }
          let oldValue = this.__value;
          this.__value = value;
          let entity = value ? zx.ui.editor.SubEntity.getEntity(value, true) : null;
          this.setEntity(entity);
          this.setModified(entity ? entity.getModified() : false);
          if (this.isMasterValueEditor() && this.__entities)
            Object.values(this.__entities).forEach(entity => entity.setModified(false));
          await this._applyValue(value, oldValue, "value");
          await this.fireDataEventAsync("changeValue", value, oldValue);
        } finally {
          this.__inSetValue = false;
        }
      };

      if (this.__setValuePromise) this.__setValuePromise = this.__setValuePromise.then(setValueImpl);
      else this.__setValuePromise = setValueImpl();

      let promise = this.__setValuePromise;
      await promise;
      if (promise === this.__setValuePromise) {
        this.__setValuePromise = null;
      }
    },

    /**
     * Returns true if we're in setValue
     *
     * @return {Boolean}
     */
    inSetValue() {
      return this.__inSetValue;
    },

    /**
     * Resetter for psuedo property `value`
     */
    async resetValue() {
      await this.setValue(null);
    },

    /**
     * Apply method for psuedo property `value`
     */
    async _applyValue(value, oldValue) {},

    /**
     * Apply method
     */
    _applyEntity(value, oldValue) {
      if (oldValue) {
        oldValue.removeListener("changeModified", this.__onEntityChangeModified, this);
        oldValue.decRef();
      }
      if (value) {
        value.incRef();
        value.addListener("changeModified", this.__onEntityChangeModified, this);
      }
      let mva = this.getMasterValueAccessor();
      if (mva) {
        if (oldValue) mva.detachSubEntity(oldValue);
        if (value) mva.attachSubEntity(value);
      }
    },

    /**
     * Apply method
     */
    _applyModified(value) {
      if (this.inSetValue()) return;

      let entity = this.getEntity();
      if (entity) entity.setModified(value);

      if (!value && this.__entities) Object.values(this.__entities).forEach(entity => entity.setModified(false));
    },

    /**
     * Event handler for changes in the modified property of entities; note that this is collected to
     * sub entities and master entity
     *
     * @param {*} evt
     */
    __onEntityChangeModified(evt) {
      let modifiedEntity = evt.getTarget();
      let thisEntity = this.getEntity();
      let modified = evt.getData();
      this.debug(`entity modified=${modified}: modifiedEntity=${modifiedEntity}`);
      if (thisEntity === modifiedEntity) this.setModified(modified);
      else if (thisEntity !== modifiedEntity && modified) this.setModified(true);
    },

    /**
     * Shortcut to get the master value
     *
     * @returns {*}
     */
    getMasterValue() {
      if (this.isMasterValueEditor()) {
        return this.getValue();
      } else {
        let mva = this.getMasterValueAccessor();
        if (mva) return mva.getValue();
        else throw new Error(`Cannot getMasterValue ${this.classname} because there is no masterValueAccessor`);
      }
    },

    /**
     * @returns {Boolean} whether this editor edits the master value
     */
    isMasterValueEditor() {
      return this._masterValueEditor;
    },

    /**
     * Apply method
     */
    _applyMasterValueAccessor(value, oldValue) {
      if (value && this.isMasterValueEditor())
        throw new Error(
          `Unexpected masterValueAccessor set on an editor ${this.classname} where isMasterValueEditor() returns true (use one or the other)`
        );

      let entity = this.getEntity();
      if (oldValue) {
        if (this.__entities) Object.values(this.__entities).forEach(entity => oldValue.detachSubEntity(entity));
        if (entity) oldValue.detachSubEntity(entity);
      }
      if (value) {
        if (entity) value.attachSubEntity(entity);
        if (this.__entities) Object.values(this.__entities).forEach(entity => value.attachSubEntity(entity));
      }
      this.getOwnedQxObjects().forEach(object => {
        if (object instanceof zx.ui.editor.Editor && !object.isMasterValueEditor())
          object.setMasterValueAccessor(value);
      });
    },

    /**
     * Saves the master value
     */
    async save() {
      if (!this.getValue()) return;
      if (this.isMasterValueEditor()) await this.saveValue();
      else {
        let mva = this.getMasterValueAccessor();
        if (mva) await mva.saveValue();
        else throw new Error(`Cannot save ${this.classname} because there is no masterValueAccessor`);
      }
    },

    /**
     * @Override
     */
    async saveValue() {
      if (await this.fireDataEventAsync("save", this.getValue(), null, true)) await this._saveValueImpl();
      this.setModified(false);
    },

    /**
     * Actually saves the value
     */
    async _saveValueImpl() {
      await this.getValue().save();
    },

    /**
     * @Override
     */
    attachSubEntity(entity) {
      let mva = this.getMasterValueAccessor();
      entity.addListener("changeModified", this.__onEntityChangeModified, this);
      if (!this.__entities) this.__entities = {};
      this.__entities[entity.toHashCode()] = entity;
      if (mva) mva.attachSubEntity(entity);
    },

    /**
     * @Override
     */
    detachSubEntity(entity) {
      let mva = this.getMasterValueAccessor();

      entity.removeListener("changeModified", this.__onEntityChangeModified, this);
      delete this.__entities[entity.toHashCode()];
      if (mva) mva.detachSubEntity(entity);
    },

    /**
     * @Override
     */
    _createQxObject(id) {
      let object = this.base(arguments, id);
      let mva = this.isMasterValueEditor() ? this : this.getMasterValueAccessor();
      if (mva) {
        if (object instanceof zx.ui.editor.Editor && !object.isMasterValueEditor()) {
          object.setMasterValueAccessor(mva);
        }
      }
      /*
       * Dont do this, it un-sets important things like readOnly.
       * This needs to be in framework, so read only can inherit from its
       * parent/ancestor
       *
      if (object)
        this._setEditableOnObject(object, this.getEditable());
       */
      return object;
    },

    /**
     * Apply method
     */
    _applyEditable(value) {
      this.getOwnedQxObjects().forEach(object => this._setEditableOnObject(object, value));
    },

    /**
     * Called to apply the `editable` property value onto owned objects, if/when the object supports it
     *
     * @param {*} object
     * @param {Boolean} editable
     */
    _setEditableOnObject(object, editable) {
      if (typeof object.setEditable == "function") object.setEditable(editable);
      else if (typeof object.setReadOnly == "function") object.setReadOnly(!editable);
      else if (typeof object.setEnabled == "function") object.setEnabled(editable);
    },

    /**
     * Callback for changes to the autoSave property
     *
     * @param value
     * @param oldValue
     * @returns
     */
    _applyAutoSave(value, oldValue) {
      if (value) zx.ui.editor.AutoSave.getInstance().add(this._onAutoSave, this);
      else zx.ui.editor.AutoSave.getInstance().remove(this._onAutoSave, this);
    }
  }
});
