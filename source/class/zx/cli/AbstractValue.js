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

qx.Class.define("zx.cli.AbstractValue", {
  type: "abstract",
  extend: qx.core.Object,

  construct(name) {
    super();
    if (name) {
      this.setName(name);
    }
  },

  properties: {
    /** Name of the flag or argument */
    name: {
      init: null,
      nullable: true,
      check: "String",
      transform: "__transformName"
    },

    /** Description, used in the usage statement */
    description: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Data type  */
    type: {
      init: null,
      nullable: true,
      check: ["string", "boolean", "integer", "float"]
    },

    /** Whether this is an array */
    array: {
      init: false,
      check: "Boolean"
    },

    /** Whether this must be provided */
    required: {
      init: false,
      check: "Boolean"
    },

    /** The parsed value */
    value: {
      init: null,
      nullable: true
    }
  },

  members: {
    /** @type{String[]?} list of error messages */
    __errors: null,

    /**
     * Transform for `name`
     */
    __transformName(value) {
      return qx.lang.String.camelCase(value);
    },

    /**
     * Adds an error message
     *
     * @param {String} msg
     */
    _error(msg) {
      if (!this.__errors) {
        this.__errors = [];
      }
      this.__errors.push(msg);
    },

    /**
     * Returns the hyphenated version of the `name` property (which is always held as camelCase)
     *
     * @returns {String}
     */
    getHyphenatedName() {
      return qx.lang.String.hyphenate(this.getName());
    },

    toString() {
      return this.getName() || this.getDescription() || this.classname;
    },

    parse(cmdName, fnGetMore) {
      throw new Error(`No such implementation for ${this.classname}`);
    }
  }
});
