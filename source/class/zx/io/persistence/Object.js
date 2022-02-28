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


/**
 * Base class for objects which can be persisted.  You do not have to derive from this
 * base class, it's just here as a helpful utility - but your classes must implement
 * `zx.io.persistence.IObject`
 *
 */
qx.Class.define("zx.io.persistence.Object", {
  extend: qx.core.Object,
  type: "abstract",
  include: [zx.io.persistence.MObject],

  implement: [
    zx.io.persistence.IObject,
    zx.io.persistence.IObjectNotifications
  ],

  "@": [
    new zx.io.persistence.anno.Class().set({
      refIo: new zx.io.persistence.ClassRefIo()
    }),
    new zx.io.remote.anno.Class().set({
      refIo: new zx.io.persistence.ClassRefIo()
    })
  ]
});
