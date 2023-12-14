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

const fs = require("fs");
const path = require("path");

/**
 * Implements a database using NeDB (https://github.com/louischatriot/nedb)
 */
qx.Class.define("zx.io.persistence.db.NedbDatabase", {
  extend: zx.io.persistence.db.Database,

  construct(rootDir) {
    this.base(arguments);
    this.__rootDir = rootDir;
  },

  destruct() {
    if (this.__nedb) this.close();
  },

  members: {
    /** @type{String} the root directory of the database */
    __rootDir: null,

    /** @type{Nedb} the NEDB instance */
    __nedb: null,

    /*
     * @Override
     */
    async open() {
      if (!fs.existsSync(this.__rootDir)) throw new Error("Cannot find root directory for database: " + this.__rootDir);
      const Nedb = require("nedb");
      this.__nedb = new Nedb({
        filename: path.join(this.__rootDir, "documents.nedb")
      });
      await zx.utils.Promisify.call(cb => this.__nedb.loadDatabase(cb));

      // Compaction has a performance hit but ensures all data is flushed to disk
      this.__nedb.persistence.setAutocompactionInterval(60 * 1000);

      return await this.base(arguments);
    },

    /*
     * @Override
     */
    async close() {
      if (this.__nedb) {
        this.__nedb.persistence.stopAutocompaction();
        this.__nedb.persistence.compactDatafile();
        this.__nedb = null;
      }
      await this.base(arguments);
    },

    /*
     * @Override
     */
    async save() {
      // Note that we do not flush to disk with nedb, because `save` is intended to provide
      //  a notification that a saver is required but nedb handles that automatically; the
      //  autocompaction is providing a regular flush to disk.
    },

    /*
     * @Override
     */
    async flush() {
      this.__nedb.persistence.compactDatafile();
    },

    /*
     * @Override
     */
    async find(clazz, query, projection) {
      let result = await this.__nedb.find(query, projection);
      return result;
    },

    /*
     * @Override
     */
    async findOne(clazz, query, projection) {
      let json = await zx.utils.Promisify.call(cb => this.__nedb.findOne(query, projection, cb));
      return json;
    },

    /*
     * @Override
     */
    async findAndRemove(clazz, query) {
      await zx.utils.Promisify.call(cb => this.__nedb.remove(query, {}, cb));
      return true;
    },

    /*
     * @Override
     */
    async getDataFromUuid(clazz, uuid) {
      let data = await this.findOne(clazz, { _id: uuid });
      return {
        json: data
      };
    },

    /*
     * @Override
     */
    async _sendJson(uuid, json) {
      json._id = json._uuid;
      await zx.utils.Promisify.call(cb => {
        this.__nedb.update({ _id: uuid }, json, { upsert: true }, (err, numAffected, affectedDocuments, upsert) => {
          //console.log("Update: " + JSON.stringify({err, numAffected, affectedDocuments, upsert}));
          cb(err);
        });
      });
    },

    /*
     * @Override
     */
    async removeByUuid(clazz, uuid) {
      await this.findAndRemove({ _id: uuid });
      return true;
    }
  }
});
