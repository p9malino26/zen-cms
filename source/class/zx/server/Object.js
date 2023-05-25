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

qx.Class.define("zx.server.Object", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],

  members: {
    /**
     * Saves this object to the database
     */
    "@save": zx.io.remote.anno.Method.DEFAULT,
    async save() {
      await zx.server.Standalone.getInstance().putObject(this);
    },

    /**
     * Deletes this object from the database
     */
    async deleteFromDatabase() {
      let uuid = this.toUuid();
      await zx.server.Standalone.getInstance().getDb().removeByUuid(uuid);
    },

    toString() {
      if (this.$$uuid) {
        return this.classname + "[" + this.toHashCode() + "::" + this.toUuid() + "]";
      }
      return this.classname + "[" + this.toHashCode() + "]";
    }
  }
});
