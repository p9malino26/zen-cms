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

qx.Class.define("zx.cms.content.AbstractMiniEditor", {
  extend: zx.ui.editor.FormEditor,

  construct() {
    super();
    if (this._remoteControlProperties) {
      this.__targets = {};
      this._remoteControlProperties.forEach(propertyName => {
        let target = new zx.utils.Target((value, oldValue) =>
          this.fireDataEvent("propertyChanged", {
            propertyName,
            value,
            oldValue
          })
        );

        this.__targets[propertyName] = {
          target,
          bindId: this.bind("value." + propertyName, target, "value")
        };
      });
    }
  },

  destruct() {
    if (this.__targets) {
      Object.values(this.__targets).forEach(data => {
        this.removeBinding(data.bindId);
        data.target.dispose();
      });
      this.__targets = null;
    }
  },

  events: {
    propertyChanged: "qx.event.type.Data"
  },

  members: {
    /** @Override */
    _masterValueEditor: false,

    /** @type{String[]} array of properties that need to be copied to the thin client when changed */
    _remoteControlProperties: null,

    /**
     * Called by `LiveEditProxy` when the thin client edits content
     *
     * @param {String} propertyName name of the property that changed
     * @param {*} value
     */
    liveEdited(propertyName, value) {
      if (this._remoteControlProperties && qx.lang.Array.contains(this._remoteControlProperties, propertyName)) {
        let value = this.getValue();
        if (!value) {
          this.warn(`Live edit of ${propertyName} but there is no piece to update`);
        } else {
          value["set" + qx.lang.String.firstUp(propertyName)](value);
        }
      }
    }
  }
});
