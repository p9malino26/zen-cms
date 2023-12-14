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
 * Base class for a widget that is an editor for a (potentially) complex object,
 * eg an editor for something like a "Person" or an "Address" object.
 *
 * Tracking when something being edited is not as simple as it may at first seem,
 * because Editor classes can also include other Editor instances - sometimes this
 * can be quite a substantial graph of Editor instances, which are editing a graph
 * of objects.  See below.
 *
 * ## Master Value
 * Some objects are edited and saved independently of each other, while others are
 * embedded in a master object - for example, an Address object might be embedded in
 * a Person object; the Person object has its own record in the database, but the Address
 * object does not (i.e. the Address is stored inside the Person record).
 *
 * However, when you write editors for Person and Address, they would have separate
 * `zx.ui.editor.Editor` classes.  When the user modifies a field, the editor updates
 * the `modified` property, so that (eg) a "Save" button on the UI can be enabled and the
 * code knows that the Person object needs to be saved to the database.
 *
 * As the Address object is embedded, then user changes to the Address fields need to
 * change the Person editor's `modified` property.
 *
 * In this example, the Person object is called a "master value", and the Person editor
 * class is the "Master Value".  The Address is a "child value", and the Address editor
 * MUST redefine `_masterValueEditor` to be `false`.
 *
 * ### Internal implementation of Master Value
 * So that `modified` can be properly tracked, all the child value editors (recursively)
 * must be connected to the master value editor; this is done by setting the `masterValueAccessor`
 * property of the child editor.  Editor classes do this automatically for child value
 * editors returned by `_createQxObjectImpl`, you will have to do this manually if you
 * create the editors outside of that mechanism.
 *
 * The Editor also tracks the child value objects via `zx.ui.editor.SubEntity` instances,
 * which allows the child editor to operate on lists of objects, and modify a whole graph
 * of objects which are child value objects - the master editor is then able to reset the
 * modified flags for all child value objects, even if they are no longer being edited.
 *
 * ## Nested Master Values and Editors
 * It is also possible (and perfectly reasonable) to nest editors of Master Values within
 * one another - for example, let's say that a Person can buy Tickets; each Ticket is a
 * "master value" (ie is saved separately in the database).  Your PersonEditor class might
 * have a section where all the Tickets can be browsed by the user and edited.
 *
 * While you could have a "save" button on each Master Value editor, it is generally expected
 * that saving at the top level (ie the Person) will also save edits to nested values (ie
 * the Ticket being edited will also be saved).
 *
 * To do this, use a `zx.ui.editor.ModifiedMonitor` instance and set it on the outer most
 * Editor where you want to place a "save" button; that ModifiedMonitor instance has a
 * `modified` property that will will be `true` if *any* of the editors within it are
 * modified.  By binding the `zx.ui.editor.ModifiedMonitor.modified` property to your "save"
 * button's `enabled` property, you can show the user that something needs to be saved; and
 * by calling the ModifiedMonitor instance's `saveAll` method, you can ensure that all
 * editors are saved.
 *
 * You can set ModifiedMonitor at any point in the tree of Editors - the ModifiedMonitor will
 * only apply to descendents which do not have an explicit ModifiedMonitor, and will only
 * apply to Master Value Editors.
 */
qx.Class.define("zx.ui.editor.Editor", {
  extend: qx.ui.core.Widget,
  implement: [zx.ui.editor.IMasterValueAccessor],

  destruct() {
    this.setMasterValueAccessor(null);
    this.setEntity(null);
    this.setValue(null);
    if (this.__entities) {
      Object.values(this.__entities).forEach(entity => entity.removeListener("changeModified", this.__onEntityChangeModified, this));

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
      init: false,
      nullable: false,
      check: "Boolean",
      event: "changeModified",
      apply: "_applyModified"
    },

    /** Shared monitor that tracks modified in a tree of master value editors */
    modifiedMonitor: {
      init: null,
      nullable: true,
      check: "zx.ui.editor.ModifiedMonitor",
      event: "changeModifiedMonitor",
      apply: "_applyModifiedMonitor"
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
    /** @type{Boolean} set to true if this editor is for a master value, false if is is for subentities
     *
     * See class description for details
     */
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
          if (this.isMasterValueEditor() && this.__entities) {
            Object.values(this.__entities).forEach(entity => entity.setModified(false));
          }
          await this._applyValue(value, oldValue, "value");
          await this.fireDataEventAsync("changeValue", value, oldValue);
        } finally {
          this.__inSetValue = false;
        }
      };

      if (this.__setValuePromise) {
        this.__setValuePromise = this.__setValuePromise.then(setValueImpl);
      } else this.__setValuePromise = setValueImpl();

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
        if (oldValue) {
          mva.detachSubEntity(oldValue);
        }
        if (value) {
          mva.attachSubEntity(value);
        }
      }
    },

    /**
     * Apply method
     */
    _applyModified(value) {
      if (this.inSetValue()) {
        return;
      }

      let entity = this.getEntity();
      if (entity) {
        entity.setModified(value);
      }

      if (!value && this.__entities) {
        Object.values(this.__entities).forEach(entity => entity.setModified(false));
      }
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
      if (thisEntity === modifiedEntity) {
        this.setModified(modified);
      } else if (thisEntity !== modifiedEntity && modified) {
        this.setModified(true);
      }
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
        if (mva) {
          return mva.getValue();
        } else throw new Error(`Cannot getMasterValue ${this.classname} because there is no masterValueAccessor`);
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
      if (value && this.isMasterValueEditor()) {
        throw new Error(`Unexpected masterValueAccessor set on an editor ${this.classname} where isMasterValueEditor() returns true (use one or the other)`);
      }

      let entity = this.getEntity();
      if (oldValue) {
        if (this.__entities) {
          Object.values(this.__entities).forEach(entity => oldValue.detachSubEntity(entity));
        }
        if (entity) {
          oldValue.detachSubEntity(entity);
        }
      }

      if (value) {
        if (entity) {
          value.attachSubEntity(entity);
        }
        if (this.__entities) {
          Object.values(this.__entities).forEach(entity => value.attachSubEntity(entity));
        }
      }

      this.getOwnedQxObjects().forEach(object => {
        if (object instanceof zx.ui.editor.Editor && !object.isMasterValueEditor()) {
          object.setMasterValueAccessor(value);
        }
      });
    },

    /**
     * Apply for modifiedMonitor
     */
    _applyModifiedMonitor(value, oldValue) {
      if (value && !this.isMasterValueEditor()) {
        throw new Error(`Unexpected modifiedMonitor set on an editor ${this.classname} where isMasterValueEditor() returns false`);
      }

      if (oldValue) {
        oldValue.removeMasterValueEditor(this);
        this.getOwnedQxObjects().forEach(object => {
          if (object instanceof zx.ui.editor.Editor && object.isMasterValueEditor() && object.getModifiedMonitor() === oldValue) {
            object.setModifiedMonitor(null);
          }
        });
      }
      if (value) {
        value.addMasterValueEditor(this);
        this.getOwnedQxObjects().forEach(object => {
          if (object instanceof zx.ui.editor.Editor && object.isMasterValueEditor() && object.getModifiedMonitor() === null) {
            object.setModifiedMonitor(value);
          }
        });
      }
    },

    /**
     * Saves the master value
     */
    async save() {
      if (!this.getValue()) {
        return;
      }
      if (this.isMasterValueEditor()) {
        await this.saveValue();
      } else {
        let mva = this.getMasterValueAccessor();
        if (mva) {
          await mva.saveValue();
        } else throw new Error(`Cannot save ${this.classname} because there is no masterValueAccessor`);
      }
    },

    /**
     * @Override
     */
    async saveValue() {
      if (await this.fireDataEventAsync("save", this.getValue(), null, true)) {
        await this._saveValueImpl();
      }
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
      if (!this.__entities) {
        this.__entities = {};
      }
      this.__entities[entity.toHashCode()] = entity;
      if (mva) {
        mva.attachSubEntity(entity);
      }
    },

    /**
     * @Override
     */
    detachSubEntity(entity) {
      let mva = this.getMasterValueAccessor();

      entity.removeListener("changeModified", this.__onEntityChangeModified, this);
      delete this.__entities[entity.toHashCode()];
      if (mva) {
        mva.detachSubEntity(entity);
      }
    },

    /**
     * @Override
     */
    _createQxObject(id) {
      let object = super._createQxObject(id);
      let mva = this.isMasterValueEditor() ? this : this.getMasterValueAccessor();
      if (mva) {
        if (object instanceof zx.ui.editor.Editor && !object.isMasterValueEditor()) {
          object.setMasterValueAccessor(mva);
        }
      }
      let monitor = this.getModifiedMonitor();
      if (monitor) {
        if (object instanceof zx.ui.editor.Editor && object.isMasterValueEditor() && !object.getModifiedMonitor()) {
          object.setModifiedMonitor(monitor);
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
      if (typeof object.setEditable == "function") {
        object.setEditable(editable);
      } else if (typeof object.setReadOnly == "function") {
        object.setReadOnly(!editable);
      } else if (typeof object.setEnabled == "function") {
        object.setEnabled(editable);
      }
    },

    /**
     * Callback for changes to the autoSave property
     *
     * @param value
     * @param oldValue
     * @returns
     */
    _applyAutoSave(value, oldValue) {
      if (value) {
        zx.ui.editor.AutoSave.getInstance().add(this._onAutoSave, this);
      } else zx.ui.editor.AutoSave.getInstance().remove(this._onAutoSave, this);
    }
  }
});
