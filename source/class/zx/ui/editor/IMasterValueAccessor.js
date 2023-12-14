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

qx.Interface.define("zx.ui.editor.IMasterValueAccessor", {
  members: {
    getValue() {},

    async saveValue() {},

    attachSubEntity(entity) {},

    detachSubEntity(entity) {}
  }
});
