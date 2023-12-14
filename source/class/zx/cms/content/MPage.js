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

qx.Mixin.define("zx.cms.content.MPage", {
  members: {
    /**
     * @Override
     */
    getMiniEditorClass() {
      return zx.cms.content.PageMiniEditor;
    },

    /**
     * A description suitable for the layout tree
     *
     * @returns {String}
     */
    describeForLayoutTree() {
      return `Page`;
    }
  }
});
