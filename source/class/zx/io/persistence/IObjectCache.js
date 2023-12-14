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

qx.Interface.define("zx.io.persistence.IObjectCache", {
  members: {
    /**
     * Checks the cache to try and find the specified object; does not throw if not found
     *
     * @param {String} uuid
     * @return {zx.io.persistence.IObject}
     */
    findObjectByUuid(uuid) {}
  }
});
