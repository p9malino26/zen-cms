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
 * Used to provide extra information about array properties
 */
qx.Class.define("zx.io.persistence.anno.Array", {
  extend: qx.core.Object,

  properties: {
    arrayType: {
      check: "Class"
    }
  }
});
