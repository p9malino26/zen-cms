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

qx.Class.define("zx.cli.Flag", {
  extend: zx.cli.AbstractValue,

  properties: {
    /** Short alternative */
    shortCode: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    /**
     * Tests whether this matches the string (name or short code)
     *
     * @param {String} arg
     * @returns {Boolean}
     */
    is(arg) {
      let pos = arg.indexOf("=");
      if (pos > -1) {
        arg = arg.substring(0, pos);
      }

      if (arg.startsWith("--")) {
        arg = arg.substring(2);
        let tmp = qx.lang.String.camelCase(arg);
        if (tmp == this.getName()) {
          return true;
        }
        if (arg.startsWith("no-")) {
          arg = arg.substring(3);
          tmp = qx.lang.String.camelCase(arg);
          return tmp == this.getName();
        }
      } else if (arg.startsWith("-")) {
        return arg.substring(1) == this.getShortCode();
      }

      return false;
    },

    /**
     * Returns a string that can be used to in the usage output of the command
     *
     * @return {String}
     */
    usage() {
      let str = "--" + this.getHyphenatedName();
      if (this.getShortCode()) {
        str += "|-" + this.getShortCode();
      }

      const TYPES = {
        string: "String",
        boolean: "Boolean",
        integer: "Integer",
        float: "Float",
        enum: "One of: " + (this.getEnumValues() || []).join(", ")
      };

      let type = this.getType();
      if (type && type != "string") {
        str += " (" + TYPES[type] + ")";
      }

      if (this.getDescription()) {
        str += "  ::  " + this.getDescription();
      }

      return str;
    },

    /**
     * Parses the flag
     *
     * @param {*} cmdName
     * @param {zx.cli.ArgvIterator} argvIterator the command line arguments
     */
    parse(cmdName, argvIterator) {
      let type = this.getType();
      let pos = cmdName.indexOf("=");
      let initialValue = null;
      if (pos > -1) {
        initialValue = cmdName.substring(pos + 1);
        cmdName = cmdName.substring(0, pos);
      } else if (type == "boolean") {
        if (cmdName.startsWith("--no-")) {
          initialValue = "false";
        } else {
          initialValue = "true";
        }
      }

      let parseNext = this._valueParser(initialValue, argvIterator);

      let result = null;
      if (this.isArray()) {
        result = this.getValue() || [];
        let value = parseNext();
        if (value !== null) {
          result.push(value);
        }
        if (result.length == 0 && this.isRequired()) {
          throw new Error(`Invalid value for ${this}, expected at least one value`);
        }
      } else {
        result = parseNext();
        if (result === null && this.isRequired()) {
          throw new Error(`Invalid value for ${this}, expected a value`);
        }
      }

      this.setValue(result);
    }
  }
});
