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
 * @use(zx.cms.content.PieceController)
 */
qx.Class.define("zx.cms.content.Piece", {
  extend: zx.io.persistence.Object,
  implement: [zx.cms.render.IViewable, zx.io.remote.IProxied],
  "@": [new zx.io.remote.anno.Class().set({ clientMixins: "zx.cms.content.MPiece" })],

  properties: {
    /** Title of the piece */
    pieceTitle: {
      init: null,
      nullable: true,
      check: "String",
      event: "changePieceTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    /**
     * @Override
     */
    async prepareContext(context, rendering) {
      context._instance = this;
      context.uuid = this.toUuid();
    }
  },

  statics: {
    getUniqueDivId() {
      return "piece-" + zx.cms.content.Piece.__nextUniqueDivId++;
    },

    __nextUniqueDivId: 1
  }
});
