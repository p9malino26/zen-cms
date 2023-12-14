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

qx.Class.define("zx.io.remote.NetworkClassIos", {
  extend: zx.io.persistence.ClassIos,

  construct() {
    super(zx.io.remote.anno.Class, zx.io.remote.anno.Property, zx.io.persistence.anno.Array, zx.io.persistence.anno.Map);
  }
});
