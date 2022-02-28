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

qx.Class.define("zx.cms.content.PageRemoteControl", {
  extend: zx.cms.content.AbstractRemoteControl,

  members: {
    /**
     * @Override
     */
    getElements() {
      return [document.body];
    },

    /**
     * @Override
     */
    propertyChanged(propertyName, value, oldValue) {
      switch (propertyName) {
        case "cssClass":
          this._changeCssClass(value, oldValue);
          return;

        default:
          return this.base(arguments, propertyName, value, oldValue);
      }
    }
  }
});
