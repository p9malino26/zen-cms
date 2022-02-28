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

qx.Class.define("zx.io.persistence.DatabaseController", {
  extend: zx.io.persistence.Controller,

  construct(datasource) {
    this.base(arguments, new zx.io.persistence.DatabaseClassIos(), datasource);
  }
});
