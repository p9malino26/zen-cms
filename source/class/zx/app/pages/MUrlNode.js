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

qx.Mixin.define("zx.app.pages.MUrlNode", {
  construct() {
    this.setChildren(new qx.data.Array());
    this.addListener("changeName", evt => {
      let oldPath = this.__lastPath;
      let oldParentPath = this.__lastParentPath;
      this.fireDataEvent("changePath", this.getPath(), oldPath);
      this.fireDataEvent("changeParentPath", this.getParentPath(), oldParentPath);
    });
  },

  properties: {
    /**
     * Psuedo-properties
     *
     * `path` - the complete path to this node
     * `parentPath` - the complete path to this node's parent (ie `this.getPath() == this.getParentPath() + "/" + this.getName()`)
     */
  },

  events: {
    /** Psuedo property */
    changePath: "qx.event.type.Event",

    /** Psuedo property */
    changeParentPath: "qx.event.type.Event"
  },

  members: {
    /** @type{String} the last `path` property value */
    __lastPath: null,

    /** @type{String} the last `parentPath` property value */
    __lastParentPath: null,

    /**
     * Getter for pseudo property `path`
     * @returns {String}
     */
    getPath() {
      let segs = [];
      for (let tmp = this; tmp != null; tmp = tmp.getParent()) {
        segs.unshift(tmp.getName());
      }
      return (this.__lastPath = segs.join("/"));
    },

    /**
     * Setter for pseudo property `path`, do not use this
     */
    setPath(value) {
      if (value !== this.getPath()) {
        throw new Error(`Unexpected attempt to change the path of a ${this.classname} through '.setPath', from ${this.getPath()} to ${value}`);
      }
    },

    /**
     * Reetter for pseudo property `path`, do not use this
     */
    resetPath() {
      throw new Error(`Unexpected attempt to reset the path of a ${this.classname} through '.resetPath', from ${this.getPath()}`);
    },

    /**
     * Getter for pseudo property `parentPath`
     * @returns {String}
     */
    getParentPath() {
      let segs = [];
      for (let tmp = this; tmp != null; tmp = tmp.getParent()) {
        segs.unshift(tmp.getName());
      }
      segs.shift();
      return (this.__lastParentPath = segs.join("/"));
    },

    /**
     * Setter for pseudo property `parentPath`, do not use this
     */
    setParentPath(value) {
      if (value !== this.getPath()) {
        throw new Error(`Unexpected attempt to change the parentPath of a ${this.classname} through '.setParentPath', from ${this.getParentPath()} to ${value}`);
      }
    },

    /**
     * Resetter for pseudo property `parentPath`, do not use this
     */
    resetParentPath() {
      throw new Error(`Unexpected attempt to reset the parentPath of a ${this.classname} through '.resetParentPath', from ${this.getParentPath()}`);
    }
  }
});
