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

qx.Mixin.define("zx.cms.content.MContainerPiece", {
  members: {
    /**
     * @Override
     */
    getMiniEditorClass() {
      return zx.cms.content.ContainerPieceMiniEditor;
    },

    /**
     * A description suitable for the layout tree
     *
     * @returns {String}
     */
    describeForLayoutTree() {
      return `Container (${this.getOrientation()})`;
    }
  }
});
