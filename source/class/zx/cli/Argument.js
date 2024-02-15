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

qx.Class.define("zx.cli.Argument", {
  extend: zx.cli.AbstractValue,

  properties: {
    type: {
      init: "string",
      refine: true
    }
  },

  members: {
    /**
     * Returns a string that can be used to in the usage output of the command
     *
     * @return {String}
     */
    usage() {
      let str = "";
      if (this.getName()) {
        str += this.getHyphenatedName();
        if (this.isArray()) {
          str += "...";
        }
      }

      const TYPES = {
        string: "String",
        boolean: "Boolean",
        integer: "Integer",
        float: "Float"
      };

      let type = this.getType();
      if (type && type != "string") {
        if (this.isArray()) {
          str += " (" + TYPES[type] + "s)";
        } else {
          str += " (" + TYPES[type] + ")";
        }
      }

      if (this.getDescription()) {
        str += "  ::  " + this.getDescription();
      }

      return str;
    },

    /**
     * @Override
     */
    parse(initialValue, argvIterator) {
      let parseNext = this._valueParser(null, argvIterator);

      let result = null;
      if (this.isArray()) {
        result = [];
        while (true) {
          let value = parseNext();
          if (value === null) {
            break;
          }
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
