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
 * Simple wrapper class for templates.
 *
 * This is little more than a wrapper around a function that is able to return the source
 * code for a named template; its a class just in case it's useful to have a proper class
 * rather than a blind function.
 */
qx.Class.define("zx.cms.render.Template", {
  extend: qx.core.Object,

  construct(classname, name) {
    super();
    if (classname) {
      this.setViewableClassname(classname);
    }
    if (name) {
      this.setName(name);
    }
  },

  properties: {
    viewableClassname: {
      init: null,
      nullable: true,
      check: "String"
    },

    name: {
      check: "String"
    }
  },

  members: {
    /**
     * Loads the source of the template
     *
     * @return {String}
     */
    async getSource() {
      throw new Error("No implementation for " + this.classname + ".getSource");
    },

    /**
     * Returns a URI to identify the template - this should be sufficient that the user
     * can identify the source, eg for error messages.
     *
     * @return {String} the uri for the source
     */
    toUri() {
      throw new Error("No implementation for " + this.classname + ".toUri");
    },

    /**
     * Returns an on-disk filename to watch
     *
     * @return {String?} filename, or null if not possible
     */
    getWatchFilename() {
      return null;
    }
  }
});
