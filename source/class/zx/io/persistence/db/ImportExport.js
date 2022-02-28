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
 * Helper class for import/export
 */
qx.Class.define("zx.io.persistence.db.ImportExport", {
  extend: qx.core.Object,

  /**
   * Constructor
   *
   * @param rootDir {String} directory to import/export from/to
   * @param db {Database} the database
   */
  construct(rootDir, db) {
    this.base(arguments);
    this.__rootDir = rootDir;
    this.__db = db;
  },

  members: {
    /** @type{String} the directory */
    __rootDir: null,

    /** @type{Database} the database */
    __db: null,

    /**
     * Imports from disk to the database
     */
    async importToDb() {
      const scan = async (dir, url) => {
        let files = await fs.readdir(dir, {
          encoding: "utf8",
          withFileTypes: true
        });
        for (let i = 0; i < files.length; i++) {
          let file = files[i];
          if (file.isDirectory()) {
            let fileUrl = (url.length ? url + "/" : "") + file.name;
            await scan(path.join(dir, file.name), fileUrl);
            continue;
          }
          if (!file.isFile() || !file.name.endsWith(".json")) continue;

          let name = file.name.substring(0, file.name.length - 5);
          let fileUrl = (url.length ? url + "/" : "") + name;

          let filename = path.join(this.__rootDir, url, file.name);
          let data = await fs.readFile(filename, { encoding: "utf8" });
          data = data.trim();
          if (!data.length) {
            let current = this.__db.findOne({ url: json.url });
            if (current) {
              await this.__db.removeByUuid(json._uuid);
            }
          } else {
            let json;
            try {
              json = JSON.parse(data);
            } catch (ex) {
              this.error(`Cannot parse JSON in ${filename}: ${ex}`);
              continue;
            }

            if (json.url && json.url.toLowerCase() != fileUrl.toLowerCase())
              this.warn(`The URL in ${filename} is wrong, found ${json.url} changing to ${fileUrl}`);
            if (!url.endsWith("/_uuids")) {
              json.url = fileUrl;
            } else if (!json._uuid) {
              json._uuid = name;
            } else if (json._uuid.toLowerCase() != name.toLowerCase()) {
              this.error(`The file ${filename} has the wrong UUID, not importing`);
              continue;
            }

            if (!json._uuid) {
              let current = await this.__db.findOne({ url: fileUrl });
              if (current) {
                json._uuid = current._uuid;
              } else {
                json._uuid = this.__db.createUuid();
              }
            }
            await this.__db._sendJson(json._uuid, json);
          }
        }
      };
      await scan(this.__rootDir, "");
      await this.__db.flush();
      await this.__db.save();
    },

    /**
     * Exports from the database to disk
     */
    async exportFromDb() {
      let docs = await this.__db.find({});
      for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        let filename = doc.url
          ? path.join(this.__rootDir, doc.url + ".json")
          : path.join(this.__rootDir, "_uuids", doc._uuid);
        await fs.ensureDir(path.dirname(filename));
        await fs.writeFile(filename, JSON.stringify(doc, null, 2), {
          encoding: "utf8"
        });
      }
    }
  }
});
