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

/**
 * This class implements stand alone processing of pages, and can be used by the unit tests
 * or for generating static websites (where the pages support being static)
 *
 * @use(zx.cms.content.ContainerPiece)
 * @use(zx.cms.content.ContentPiece)
 * @use(zx.cms.content.ThinClientCodePiece)
 * @use(zx.cms.content.FeaturePiece)
 * @use(zx.cms.system.Site)
 *
 * @asset(zx/thin/theme/materials/*)
 * @asset(zx/db/template/*)
 */
qx.Class.define("zx.server.Standalone", {
  extend: qx.core.Object,

  construct() {
    this.base(arguments);
    if (zx.server.Standalone.__instance)
      console.error("Multiple instances of zx.server.Standalone detected - this is probably not intentional");
    zx.server.Standalone.__instance = this;

    this._objectsUrlsToId = {};
  },

  destruct() {
    if (zx.server.Standalone.__instance === this) zx.server.Standalone.__instance = null;
  },

  members: {
    /** {zx.server.Config} config */
    _config: null,

    /** {zx.io.persistence.db.Database} the database */
    _db: null,

    /** {zx.io.persistence.DatabaseController} the database persistance controller */
    _dbController: null,

    /** {zx.cms.system.Site} site configuration data */
    _site: null,

    /** {zx.cms.render.Renderer} the renderer for generating content */
    _renderer: null,

    /** Cache Data for object retrieved from the database */
    _objectsUrlsToId: null,

    /**
     * Called to start the server
     */
    async start() {
      let config = zx.server.Config.getInstance();
      this._config = config.getConfigData();
      await this._openDatabase();
      await this._initSite();
      await this._initRenderer();
    },

    /**
     * Called to stop the server
     */
    async stop() {
      this._site.dispose();
      this._site = null;
      this._renderer.dispose();
      this._renderer = null;
      this._dbController.dispose();
      this._dbController = null;
      this._db.close();
      this._db.dispose();
      this._db = null;
    },

    /**
     * Opens the database
     */
    async _openDatabase() {
      this._dbController = new zx.io.persistence.DatabaseController();
      let database = this._config.database || {};
      let config = zx.server.Config.getInstance();
      let isNewDatabase = false;
      switch (database.type || "null") {
        case "nedb":
          let dbDir = config.resolve(database.nedb.directory || "_cms/db/nedb");
          isNewDatabase = !(await fs.exists(dbDir));

          await fs.ensureDir(dbDir);
          this._db = new zx.io.persistence.db.NedbDatabase(dbDir);
          break;

        case "mongo":
          this._db = new zx.io.persistence.db.MongoDatabase(database.mongo);
          isNewDatabase = this._db.isNewDatabase();
          break;

        default:
          throw new Error("Cannot open database because it is an unexpected type: " + (database.type || "null"));
      }

      this._dbController.addEndpoint(this._db);
      if (database.statusFile) this._dbController.setStatusFile(database.statusFile);
      await this._db.open();

      // Make sure that there is a Security object; if this has to be created, it will initialise
      //  default permissions etc
      await this.findOneObjectByType(zx.server.auth.Security, null, true);

      let imp = database["import"];
      if (imp) {
        let when = imp.when || "initialize";
        let doImport = false;
        if ((when === "initialize" || when === "initialise") && isNewDatabase) doImport = true;
        else if (when === "always") doImport = true;

        if (doImport) {
          let impDirs = imp.from || [config.resolve("_cms/db/template")];
          for (let i = 0; i < impDirs.length; i++) {
            let filename = zx.utils.Path.locateFile(impDirs[i], {
              mustExist: true
            });
            await new zx.io.persistence.db.ImportExport(filename, this._db).importToDb();
          }
        }
      }
    },

    /**
     * Inits the site data from the database
     */
    async _initSite() {
      let site = (this._site = await this.getObjectByUrl("configuration/site"));
      return site;
    },

    /**
     * Returns the site configuration
     *
     * @returns {zx.cms.system.Site}
     */
    getSite() {
      return this._site;
    },

    /**
     * Inits the renderer
     */
    async _initRenderer() {
      let themeName = this._config.theme || qx.core.Environment.get("zx.cms.client.theme") || "website.myTheme";
      if (themeName.match(/[^a-z0-9-_.]/i))
        throw new Error(`The Theme Name must be alpha-numeric, dot or underscore characters only`);
      this._renderer = this._createRenderer();
      this._renderer.set({ themeName });
      return this._renderer;
    },

    /**
     * Creates the renderer instance
     *
     * @returns {zx.cms.render.Renderer}
     */
    _createRenderer() {
      return new zx.cms.render.Renderer();
    },

    /**
     * Returns a filename that can be used to store blobs (or any other data, EG it could be a folder)
     * based on a UUID.
     *
     * Note that parent directories may not exist
     *
     * @param {String} uuid
     * @returns {String}
     */
    getBlobFilename(uuid) {
      let blobConfig = this._config?.database?.blobs;
      if (!blobConfig || !blobConfig.directory) throw new Error("Configuration does not support blobs");
      let filename = path.join(blobConfig.directory, zx.server.Standalone.getUuidAsPath(uuid));
      return filename;
    },

    /**
     * Loads a object
     */
    async getObjectByUrl(url) {
      let uuid = this._objectsUrlsToId[url];
      if (uuid) {
        let object = await this._dbController.getByUuid(uuid);
        if (object) {
          return object;
        }
      }
      if (url.endsWith(".html")) url = url.substring(0, url.length - 5);

      let data = await this._db.findOne({ url }, { _uuid: 1 });
      uuid = (data && data._uuid) || null;
      if (!uuid) return null;
      let object = await this._dbController.getByUuid(uuid);
      if (object) {
        this._objectsUrlsToId[url] = uuid;
      }
      return object;
    },

    /**
     * Saves an object
     */
    async putObject(object) {
      await this._db.put(object);
    },

    /**
     * Locates an object of a given class and matching a query
     *
     * @param {Class<zx.io.persistence.IObject>} clazz
     * @param {*} query
     * @param {Boolean} create whether to create the object if it does not exist
     * @returns {zx.io.persistence.IObject?} null if not found
     */
    async findOneObjectByType(clazz, query, create) {
      let properties = query ? qx.lang.Object.clone(query) : {};
      query = this.__createCorrectedQuery(query);
      query._classname = clazz.classname;

      let data = await this._db.findOne(query, { _uuid: 1 });
      let uuid = (data && data._uuid) || null;
      if (uuid) {
        let object = zx.io.persistence.ObjectCaches.getInstance().findObjectByUuid(uuid);
        if (!object) object = await this._dbController.getByUuid(uuid);
        if (qx.core.Environment.get("qx.debug")) this.assertTrue(!!object);
        return object;
      }

      if (create) {
        let object = new clazz().set(properties);
        await object.save();
        return object;
      }

      return null;
    },

    /**
     * Locates an object of a given class and matching a query
     *
     * @param {Class<zx.io.persistence.IObject>} clazz
     * @param {var} query
     * @param {Integer?} limit
     * @returns {zx.io.persistence.IObject[]}
     */
    async findObjectsByType(clazz, query, limit) {
      query = this.__createCorrectedQuery(query);
      query._classname = clazz.classname;

      let data = await this._db.find(query, { _uuid: 1 });
      let all = await data
        .limit(limit || 0)
        .map(async data => {
          let uuid = (data && data._uuid) || null;
          if (!uuid) return null;
          let object = zx.io.persistence.ObjectCaches.getInstance().findObjectByUuid(uuid);
          if (object) return object;

          object = await this._dbController.getByUuid(uuid);
          return object;
        })
        .toArray();
      all = await qx.Promise.all(all);
      all = all.filter(doc => !!doc);
      return all;
    },

    /**
     * Creates a corrected version of a database query - principally, this means that `Date` objects
     * are converted into ISO strings so that range comparisons work
     *
     * @param {Map<String,Object>} query
     * @returns {Map<String,Object>} the clone
     */
    __createCorrectedQuery(query) {
      if (query === null || query === undefined) return {};
      if (qx.core.Environment.get("qx.debug")) this.assertTrue(qx.lang.Type.isObject(query));

      const scan = obj => {
        Object.getOwnPropertyNames(obj).forEach(name => {
          let value = obj[name];
          if (value) {
            if (qx.lang.Type.isDate(value)) obj[name] = value.toISOString();
            else if (qx.lang.Type.isObject(value)) scan(value);
          }
        });
      };

      query = qx.lang.Object.clone(query, true);
      scan(query);
      return query;
    },

    /**
     * Deletes an object from the database
     *
     * @param {zx.io.persistence.IObject} object object to delete
     */
    async deleteObject(object) {
      await this.deleteObjectsByType(object.constructor, { _uuid: object.toUuid() });
    },

    /**
     * Deletes objects of a given class and matching a query
     *
     * @param {Class<zx.io.persistence.IObject>} clazz
     * @param {*} query
     */
    async deleteObjectsByType(clazz, query) {
      query = this.__createCorrectedQuery(query);
      let properties = query ? qx.lang.Object.clone(query) : {};
      if (!query) query = {};
      query._classname = clazz.classname;

      await this._db.findAndRemove(query);
    },

    /**
     * Returns the database instance
     *
     * @return{zx.io.persistence.db.Database}
     */
    getDb() {
      if (!this._db) throw new Error("Database not yet opened");
      return this._db;
    },

    /**
     * Returns the object controller for the database
     *
     * @return {zx.io.persistence.DatabaseController}
     */
    getDbController() {
      return this._dbController;
    },

    /**
     * Returns the renderer
     *
     * @return {zx.cms.render.Renderer}
     */
    getRenderer() {
      return this._renderer;
    }
  },

  statics: {
    __instance: null,

    /**
     * Returns the singleton instance
     */
    getInstance() {
      return zx.server.Standalone.__instance;
    },

    /**
     * This takes a UUID and breaks it up into segments separated by path separators; the idea is that
     * we want to be able to store a bunch of files (eg blobs) based on the UUID, but if we just had
     * one directory with a million files in it, that becomes very unweildy and difficult to manage.
     *
     * The other side of the coin is that if we break it up too much and have a really deep directory
     * structure, it is equally difficult to manage because the actual files are too spread out.
     *
     * The best solution is a balance of a relatively shallow directory heirarchy, but avoiding a situation
     * where any dircetory has too many files in it
     *
     * This implementation taks a UUID like `84f41b3d-c8db-44da-b41b-3dc8dbe4da08` and transforms it
     * into `84/f4/1b3d-c8db-44da-b41b-3dc8dbe4da08`.
     *
     * @param {String} uuid the UUID to split up
     * @returns {String} the path
     */
    getUuidAsPath(uuid) {
      // 84f41b3d-c8db-44da-b41b-3dc8dbe4da08
      let filename = uuid.substring(0, 2) + path.sep + uuid.substring(2, 4) + path.sep + uuid.substring(4);
      return filename;
    }
  }
});
