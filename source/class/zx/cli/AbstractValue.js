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
      check: ["string", "boolean", "integer", "float", "enum"]
    },

    /** Allowed values if type is `enum` */
    enumValues: {
      init: null,
      nullable: true,
      check: "Array"
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

    /**
     * @Override
     */
    toString() {
      return this.getName() || this.getDescription() || this.classname;
    },

    /**
     * Returns a function that can be called to get the next value from the command line
     *
     * @param {String?} initialValue returned only once, the first time
     * @param {zx.cli.ArgvIterator} argvIterator
     * @returns {Function}
     */
    _valueParser(initialValue, argvIterator) {
      let type = this.getType();
      let eatAll = false;

      function next() {
        if (initialValue !== null) {
          let value = initialValue;
          initialValue = null;
          return value;
        }
        if (eatAll) {
          return argvIterator.pop();
        }
        let value = argvIterator.peek();
        if (value == "--") {
          eatAll = true;
          argvIterator.skip();
          value = argvIterator.pop();
        } else if (value && value.startsWith("--")) {
          return null;
        } else {
          argvIterator.skip();
        }

        return value;
      }

      const parseNext = () => {
        switch (type) {
          case "string":
          case null:
            return next();

          case "boolean":
            var arg = next();
            if (arg === null) {
              return true;
            }
            if (arg == "true" || arg == "yes" || arg == "1") {
              return true;
            }
            if (arg == "false" || arg == "no" || arg == "0") {
              return false;
            }
            throw new Error("Invalid value for " + this.toString() + ", expected nothing (true) or the words true or false");

          case "integer":
            var arg = next();
            if (arg === null) {
              return null;
            }
            var value = parseInt(arg, 10);
            if (isNaN(arg)) {
              throw new Error(`Invalid value for ${this.toString()}, expected an integer`);
            }
            return value;

          case "float":
            var arg = next();
            if (arg === null) {
              return null;
            }
            var value = parseFloat(arg);
            if (isNaN(arg)) {
              throw new Error(`Invalid value for ${this.toString()}, expected a number`);
            }
            return value;

          case "enum":
            var arg = next();
            if (arg === null) {
              return null;
            }
            let enumValues = this.getEnumValues();
            if (enumValues.indexOf(arg) < 0) {
              throw new Error(`Invalid value for ${this.toString()}, expected one of: ${enumValues.join(", ")} but found ${arg}`);
            }
            return arg;
        }

        return next();
      };

      return parseNext;
    },

    /**
     * Called to parse the value
     *
     * @param {String} initialValue
     * @param {zx.cli.ArgvIterator} argvIterator the command line arguments
     */
    parse(initialValue, argvIterator) {
      throw new Error(`No such implementation for ${this.classname}`);
    }
  }
});
