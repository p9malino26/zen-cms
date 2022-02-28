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

qx.Class.define("zx.data.Entry", {
  extend: qx.core.Object,

  construct: function (key, value) {
    this.base(arguments);
    this.set({ key: key, value: value });
  },

  properties: {
    key: {
      nullable: false
    },

    value: {
      init: null,
      nullable: true,
      event: "changeValue"
    }
  }
});
