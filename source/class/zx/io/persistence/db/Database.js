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
 * Base class for database implementations
 */
qx.Class.define("zx.io.persistence.db.Database", {
  type: "abstract",
  extend: zx.io.persistence.Endpoint,

  members: {
    /**
     * Opens the database
     */
    async open() {
      this.fireEvent("open");
    },

    /**
     * Closes the database
     */
    async close() {
      this.fireEvent("close");
    },

    /*
     * @Override
     */
    async flush() {
      // Nothing
    },

    /**
     * Searches the database, and returns the first JSON object that matches.
     * Note that the functionality of this is really determined by the underlying
     * implementation, but a facility to compare objects (see NeDB or MongoDB)
     * is expected.
     *
     * @param clazz {qx.Class} the class for the collection
     * @param query {Object} NeDB query
     * @param projection {Object?} NeDB projection
     * @return {Object?} the matched data, or null
     */
    async findOne(clazz, query, projection) {
      throw new Error(`No implementation for ${this.classname}.findOne`);
    },

    /**
     * Searches the database, and returns all the JSON objects that match.
     * Note that the functionality of this is really determined by the underlying
     * implementation, but a facility to compare objects (see NeDB or MongoDB)
     * is expected.
     *
     * @param clazz {qx.Class} the class for the collection
     * @param query {Object} NeDB query
     * @param projection {Object?} NeDB projection
     * @return {Object[]} the matched data, or empty array
     */
    async find(clazz, query, projection) {
      throw new Error(`No implementation for ${this.classname}.find`);
    },

    /**
     * Searches the database, and deletes all the JSON objects that match.
     * Note that the functionality of this is really determined by the underlying
     * implementation, but a facility to compare objects (see NeDB or MongoDB)
     * is expected.
     *
     * @param clazz {qx.Class} the class for the collection
     * @param query {Object} NeDB query
     * @return {Object[]} the matched data, or empty array
     */
    async findAndRemove(clazz, query) {
      throw new Error(`No implementation for ${this.classname}.findAndRemove`);
    }
  }
});
