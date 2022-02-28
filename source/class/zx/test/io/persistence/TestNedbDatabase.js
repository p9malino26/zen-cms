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


qx.Class.define("zx.test.io.persistence.TestNedbDatabase", {
  extend: qx.dev.unit.TestCase,

  members: {
    async testImportExport() {
      const fs = require("fs-extra");

      await fs.emptyDir("test/temp/website-db-nedb");
      let db = new zx.io.persistence.db.NedbDatabase("test/temp/website-db-nedb");
      db.open();
      let ie = new zx.io.persistence.db.ImportExport("test/persistence/website-db", db);
      await ie.importToDb();
      let json;

      json = await db.findOne({
        _uuid: "9a946080-b923-11e9-81cd-e3ec9930a628"
      });
      this.assertTrue(!!json);
      this.assertTrue(json._uuid == "9a946080-b923-11e9-81cd-e3ec9930a628");
      this.assertTrue(json._classname == "zx.test.io.persistence.Site");
      this.assertTrue(json.url == "configuration/site");

      db.close();
      fs.remove("test/temp/website-db-nedb");
    }
  }
});
