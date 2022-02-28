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

qx.Interface.define("zx.ui.tree.IRow", {
  properties: {
    /** Whether this is a static header row */
    header: {
      nullable: false,
      check: "Boolean"
    }
  }
});
