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

qx.Class.define("zx.io.remote.proxy.ClassesWriter", {
  extend: qx.core.Object,

  construct() {
    super();
    this.__templateCache = {};
  },

  properties: {
    /** Directory to output proxy source code to */
    outputPath: {
      check: "String",
      event: "changeOutputPath"
    },

    compilerTargetPath: {
      check: "String",
      event: "changeCompilerTargetPath"
    },

    verbose: {
      init: false,
      check: "Boolean"
    }
  },

  members: {
    /** @type{Map<String,Object>} template cache indexed by filename */
    __templateCache: null,

    /** @type{Object} the db.json written by the compiler */
    _db: null,

    /**
     * Loads a template from resources, caching the result
     *
     * @param {*} resourceName
     * @returns {Promise<String>} the content
     * @async
     */
    loadTemplate(resourceName) {
      let info = null;
      let filename = path.join(qx.util.LibraryManager.getInstance().get("zx", "resourceUri"), resourceName);

      const loadTemplateImpl = async () => {
        let stat = await fs.promises.stat(filename);
        if (!info.contents || !info.mtime || info.mtime.before(stat.mtime)) {
          info.contents = await fs.promises.readFile(filename, "utf8");
          info.mtime = stat.mtime;
        }
        return info.contents;
      };

      info = this.__templateCache[filename];
      if (info && info.promise) {
        return info.promise;
      }
      if (!info) {
        info = this.__templateCache[filename] = {};
      }
      info.promise = loadTemplateImpl();
      return info.promise;
    },

    async _initialise() {
      let db = await fs.promises.readFile(path.join(this.getCompilerTargetPath(), "db.json"), "utf8");
      this._db = JSON.parse(db);
    },

    async writeAllProxiedClasses() {
      await this._initialise();

      return await this.writeProxiedClassesFor(Object.keys(this._db.classInfo));
    },

    async writeProxiedClassesFor(classnames) {
      if (!this._db) {
        await this._initialise();
      }

      if (!qx.lang.Type.isArray(classnames)) {
        classnames = [classnames];
      }

      if (this.isVerbose()) {
        this.info(`Generating classes to ${path.resolve(this.getOutputPath())}`);
      }

      let classes = {};

      classnames.forEach(classname => {
        let info = this._db.classInfo[classname];
        let ifc = qx.Interface.getByName(classname);
        if (ifc) {
          if (ifc !== zx.io.remote.IProxied) {
            let flat = qx.Interface.flatten([ifc]);
            if (qx.lang.Array.contains(flat, zx.io.remote.IProxied)) {
              classes[classname] = ifc;
            }
          }
        } else {
          let clazz = qx.Class.getByName(classname);
          if (clazz && qx.Class.hasInterface(clazz, zx.io.remote.IProxied)) {
            classes[classname] = clazz;
          }
        }
      });

      for (let classname in classes) {
        let clazz = classes[classname];
        let filename = path.join(this.getOutputPath(), classname.replace(/\./g, path.sep)) + ".js";

        let anno = qx.Annotation.getOwnClass(clazz, zx.io.remote.anno.Class)[0] || null;
        if (anno && anno.getProxy() == "never") {
          try {
            await fs.promises.unlink(filename);
          } catch (ex) {
            if (ex.code != "ENOENT") {
              throw ex;
            }
          }
          continue;
        }
        if (this.isVerbose()) {
          this.info(`Writing class ${clazz.classname}`);
        }
        let writer = new zx.io.remote.proxy.ClassWriter(this, clazz);
        let str = await writer.getProxyClassCode();

        let dirname = path.dirname(filename);
        await fs.promises.mkdir(dirname, { recursive: true });

        if (fs.existsSync(filename)) {
          let current = await fs.promises.readFile(filename, "utf8");
          if (current == str) {
            continue;
          }
        }
        await fs.promises.writeFile(filename, str, "utf8");
      }
    }
  }
});
