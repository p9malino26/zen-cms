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

qx.Class.define("zx.cms.content.ContainerPieceRemoteControl", {
  extend: zx.cms.content.AbstractRemoteControl,

  members: {
    /**
     * @Override
     */
    propertyChanged(propertyName, value, oldValue) {
      let div = this.getElements()[0] || null;

      switch (propertyName) {
        case "orientation":
          div.classList.remove("qxl-container-horizontal");
          div.classList.remove("qxl-container-vertical");
          div.classList.remove("qxl-container-flow");
          div.classList.add("qxl-container-" + value);
          break;

        case "cssClass":
          this._changeCssClass(value, oldValue);
          return;

        default:
          return this.base(arguments, propertyName, value, oldValue);
      }
    }
  }
});
