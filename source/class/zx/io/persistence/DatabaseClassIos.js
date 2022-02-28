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

qx.Class.define("zx.io.persistence.DatabaseClassIos", {
  extend: zx.io.persistence.ClassIos,

  construct() {
    this.base(
      arguments,
      zx.io.persistence.anno.Class,
      zx.io.persistence.anno.Property,
      zx.io.persistence.anno.Array,
      zx.io.persistence.anno.Map
    );
  }
});
