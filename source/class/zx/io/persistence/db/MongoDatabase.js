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
/*
 * @ignore (BigNumber)
 */

const fs = require("fs");
const path = require("path");
const { Decimal128 } = require("mongodb");

/**
 * Implements a database using MongoDB
 */
qx.Class.define("zx.io.persistence.db.MongoDatabase", {
  extend: zx.io.persistence.db.Database,

  construct(options) {
    super();
    this.__uri = options.uri;
    this.__databaseName = options.databaseName;
    this.__collectionNamesForClasses = {};
  },

  destruct() {
    if (this.__mongoClient) {
      this.close();
    }
  },

  members: {
    /** @type{String} the URI of the database to connect to */
    __uri: null,

    /** @type{String} the name of the database */
    __databaseName: null,

    /** @type{MongoClient} the Mongo client instance */
    __mongoClient: null,

    /** @type{MongoClient.DB} the Mongo database */
    __db: null,

    /** @type{Boolean} true if the collection did not exist when the database was opened */
    __newDatabase: false,

    /** @type{Object<String,String>} lookup table of the collection names to use for given classnames */
    __collectionNamesForClasses: null,

    /*
     * @Override
     */
    async open() {
      const { MongoClient } = require("mongodb");
      this.__mongoClient = new MongoClient(this.__uri);
      await this.__mongoClient.connect();
      this.__db = this.__mongoClient.db(this.__databaseName);
      let collections = await this.__db.collections();
      let exists = collections.find(coll => coll.collectionName == "zx.server.cms.Page");
      this.__newDatabase = !exists;

      return await super.open();
    },

    /**
     * Returns the collection for a class
     * @param {string|qx.Class} clazz
     * @returns {import("mongodb").Collection}
     */
    getCollection(clazz) {
      let classname = clazz.classname || clazz.toString();
      let collectionName = this.__collectionNamesForClasses[classname];
      if (collectionName === undefined) {
        let tmp = clazz;
        if (typeof tmp == "string") {
          tmp = qx.Class.getByName(classname);
        }
        if (tmp) {
          let annos = qx.Annotation.getClass(clazz, zx.io.persistence.anno.Class);
          if (annos) {
            collectionName = annos.find(anno => !!anno.getCollectionName())?.getCollectionName() || null;
          }
        }
        if (!collectionName) {
          collectionName = classname;
        }
        this.__collectionNamesForClasses[classname] = collectionName;
      }
      return this.__db.collection(collectionName);
    },

    /**
     * Returns the mongo client connection
     *
     * @returns {MongoClient}
     */
    getMongoClient() {
      return this.__mongoClient;
    },

    /**
     * Returns the mongo client connection
     *
     * @returns {MongoClient}
     */
    getMongoDb() {
      return this.__db;
    },

    /**
     * Detects whether the collection existed when the database was opened
     *
     * @return {Boolean}
     */
    isNewDatabase() {
      return this.__newDatabase;
    },

    /*
     * @Override
     */
    async close() {
      if (this.__mongoClient) {
        this.__mongoClient.close();
        this.__mongoClient = null;
        this.__db = null;
      }
      await super.close();
    },

    /*
     * @Override
     */
    async save() {},

    /*
     * @Override
     */
    async flush() {},

    /**
     * Compiles options for use with a find query
     *
     * @param {*} projection
     * @param {*} options
     * @returns {Object}
     */
    __createOptions(projection, options) {
      options = options ? qx.lang.Object.clone(options) : {};
      if (options.projection && projection) {
        throw new Error("Cannot use multiple projections at once");
      }
      if (projection) {
        options.projection = projection;
      }
      return options;
    },

    /*
     * @Override
     */
    async find(clazz, query, projection, options) {
      let collection = await this.getCollection(clazz);
      let result = await collection.find(query, this.__createOptions(projection, options));
      return result;
    },

    /*
     * @Override
     */
    async findOne(clazz, query, projection, options) {
      let collection = await this.getCollection(clazz);
      if (qx.core.Environment.get("qx.debug")) {
        if ((await collection.countDocuments(query)) > 1) {
          throw new Error(`More than one document found in ${clazz.classname || clazz} for query ${JSON.stringify(query)}`);
        }
      }
      let json = await collection.findOne(query, this.__createOptions(projection, options));
      return json;
    },

    /*
     * @Override
     */
    async updateOne(clazz, query, json) {
      let collection = await this.getCollection(clazz);
      if (query) {
        if (qx.core.Environment.get("qx.debug")) {
          if ((await collection.countDocuments(query)) > 1) {
            throw new Error(`More than one document found ${clazz.classname || clazz} for query ${JSON.stringify(query)}`);
          }
        }
        await collection.replaceOne(query, json, { upsert: true });
      } else {
        await collection.insertOne(json);
      }
    },

    /*
     * @Override
     */
    async getDataFromUuid(clazz, uuid) {
      let data = await this.findOne(clazz, { _id: uuid });
      if (!data) {
        return null;
      }
      return {
        json: data
      };
    },

    /*
     * @Override
     */
    async getDataFromQuery(clazz, query, projection) {
      let data = await this.findOne(clazz, query, projection);
      if (!data) {
        return null;
      }
      return {
        json: data
      };
    },

    /*
     * @Override
     */
    async _sendJson(uuid, json) {
      json._id = json._uuid;
      let collection = await this.getCollection(json._classname);
      await collection.replaceOne({ _id: uuid }, json, { upsert: true });
    },

    /*
     * @Override
     */
    async removeByUuid(clazz, uuid) {
      let collection = await this.getCollection(clazz);
      await collection.deleteOne({ _id: uuid }, {});
      return true;
    },

    /*
     * @Override
     */
    async findAndRemove(clazz, query) {
      let collection = await this.getCollection(clazz);
      await collection.deleteMany(query, {});
      return true;
    },

    /*
     * @Override
     */
    encodeValue(value) {
      if (value instanceof BigNumber) {
        return Decimal128.fromString(value.toString());
      }
      return value;
    },

    /*
     * @Override
     */
    decodeValue(value) {
      if (value instanceof Decimal128) {
        return new BigNumber(value.toString());
      }
      return value;
    }
  }
});
