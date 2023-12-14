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
 * Tracks a shared set of `zx.ui.editor.Editor` instances that are in a tree,
 * so that there can be a combined `modified` property, which is so that there
 * can be one "Save" button that applies to the entire tree of editors.
 */
qx.Class.define("zx.ui.editor.ModifiedMonitor", {
  extend: qx.core.Object,

  construct() {
    super();
    this.__masterValueEditors = [];
  },

  properties: {
    /** Whether any of the editors are modified */
    modified: {
      init: false,
      check: "Boolean",
      event: "changeModified"
    }
  },

  members: {
    __masterValueEditors: null,

    /**
     * Adds an editor (must be a Master Value Editor)
     *
     * @param child {zx.ui.editor.Editor} child the editor to add
     */
    addMasterValueEditor(child) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(!qx.lang.Array.contains(this.__masterValueEditors, child));
      }
      this.__masterValueEditors.push(child);
      child.addListener("changeModified", this.__updateModified, this);
      this.__updateModified();
    },

    /**
     * Removed an editor (must be a Master Value Editor and previously added)
     *
     * @param child {zx.ui.editor.Editor} child the editor to add
     */
    removeMasterValueEditor(child) {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(qx.lang.Array.contains(this.__masterValueEditors, child));
      }
      child.removeListener("changeModified", this.__updateModified, this);
      qx.lang.Array.remove(this.__masterValueEditors, child);
      this.__updateModified();
    },

    /**
     * Saves all modified editors
     */
    async saveAll() {
      for (let i = 0; i < this.__masterValueEditors.length; i++) {
        let ed = this.__masterValueEditors[i];
        if (ed.isModified()) {
          await ed.save();
        }
      }
      this.__updateModified();
    },

    /**
     * Updates the `modified` property after changes to the editor(s)
     */
    __updateModified() {
      let modified = this.__masterValueEditors.some(ed => ed.isModified());
      this.setModified(modified);
    }
  }
});
