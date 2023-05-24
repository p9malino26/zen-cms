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

const path = require("path");

qx.Class.define("zx.server.Config", {
  extend: qx.core.Object,

  /**
   * Constructor; optionally sets the configuration data (assuming that it will
   * not be loaded via `loadConfig`)
   *
   * @param data {Object?} the configuration settings
   * @param rootDir {String?} path to the root directory for the CMS database (default is pwd)
   */
  construct(data, rootDir) {
    this.base(arguments);
    if (zx.server.Config.__instance) throw new Error("Multiple instances of zx.server.Config");
    zx.server.Config.__instance = this;
    if (data) {
      this._config = data;
      if (data.directory) this._rootDir = data.directory;
      else this._rootDir = data.directory || rootDir || "website";
    }
  },

  destruct() {
    if (zx.server.Config.__instance === this) zx.server.Config.__instance = null;
  },

  members: {
    _config: null,
    _rootDir: null,

    /**
     * Loads configuration file
     *
     * @param filename {String?} the filename, default is "cms.json"
     */
    async loadConfig(filename) {
      if (this._config) {
        throw new Error("Cannot load configuration data twice");
      }
      if (!filename) {
        filename = "cms.json";
      }
      this._config = await zx.utils.Json.loadJsonAsync(filename);
      let configDir = path.dirname(path.resolve(filename));
      this._rootDir = path.resolve(configDir, this._config.directory || "website");
      return this._config;
    },

    /**
     * Returns the configuration data
     *
     * @return {Object} the data
     */
    getConfigData() {
      return this._config;
    },

    /**
     * Returns the root directory
     */
    getRootDir() {
      return this._rootDir;
    },

    /**
     * Helper method to resolve a filename relative to the root directory
     */
    resolve(filename) {
      return path.resolve(this._rootDir, filename);
    }
  },

  statics: {
    /** @type {String} the resource root directory */
    RESOURCE_DIR: null,

    /** @type {Config} the instance */
    __instance: null,

    /**
     * Returns the current singleton instance
     *
     * @return {Config} the instance
     */
    getInstance() {
      if (!zx.server.Config.__instance) throw new Error("An instance of zx.server.Config has not yet been created");
      return zx.server.Config.__instance;
    }
  },

  defer(statics) {
    // The resource dir is always the same on Qooxdoo v6 with the Qx Compiler
    statics.RESOURCE_DIR = qx.util.LibraryManager.getInstance().get("qx", "resourceUri") + path.sep;
  }
});
