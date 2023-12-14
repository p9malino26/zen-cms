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

const fs = require("fs-extra");
const path = require("path");

qx.Class.define("zx.utils.JsonSchema", {
  extend: qx.core.Object,

  construct(filename) {
    super();
    this.__filename = filename;
  },

  members: {
    /** @type{String} filename of the schema definition */
    __filename: null,

    /** @type{Function} AJV schema validator */
    __validate: null,

    /**
     * Called to load the schema definition
     */
    async _loadSchema() {
      let schemaJson = await fs.readFile(this.__filename, "utf8");
      schemaJson = JSON.parse(schemaJson);
      zx.utils.JsonSchema.__ajv.removeSchema(schemaJson["$id"]);
      this.__validate = zx.utils.JsonSchema.__ajv.compile(schemaJson);
    },

    /**
     * Reads a JSON file and parses it
     *
     * @param {String} filename
     * @returns {Object} the parsed, and validated, data
     * @throws if the JSON fails validation
     */
    async parseFile(filename) {
      let data = await fs.readFile(filename, "utf8");
      let json = JSON.parse(data);

      this.validateData(json);
      return json;
    },

    /**
     * Validates the data
     *
     * @param {Object} data
     * @throws if the data is invalid
     */
    validateData(data) {
      if (this.__validate(data)) {
        return;
      }

      let msg = this.__validate.errors.map(err => `${err.dataPath} ${err.message}`).join("\n");
      throw new Error(msg);
    },

    /**
     * Tests whether the data is valid without throwing an exception
     *
     * @param {*} data
     * @returns {Boolean}
     */
    isValid(data) {
      return this.__validate(data);
    }
  },

  statics: {
    /** @type{Ajv} AJV instance */
    __ajv: null,

    /** @type{Map<String,Object>} cache of schemas */
    __schemas: {},

    /**
     * Returns a schema instance
     *
     * @param {*} filename
     * @returns
     */
    async getSchema(filename) {
      if (!zx.utils.JsonSchema.__ajv) {
        const Ajv = require("ajv");
        zx.utils.JsonSchema.__ajv = new Ajv({
          allErrors: true,
          jsonPointers: true
        });
      }

      filename = path.resolve(filename);
      let data = zx.utils.JsonSchema.__schemas[filename];
      let stat = await fs.stat(filename);
      if (data) {
        if (data.mtime.getTime() >= stat.mtime.getTime()) {
          return data.schema;
        }
      }

      data = zx.utils.JsonSchema.__schemas[filename] = {
        mtime: stat.mtime,
        schema: new zx.utils.JsonSchema(filename)
      };

      await data.schema._loadSchema();

      return data.schema;
    }
  }
});
