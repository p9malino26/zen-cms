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

qx.Class.define("zx.cms.content.ThinClientCodePiece", {
  extend: zx.cms.content.Piece,

  properties: {
    pieceTitle: {
      refine: true,
      init: "Client Code"
    },

    code: {
      init: "",
      check: "String",
      event: "changeContent",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    async prepareContext(context, rendering) {
      await super.prepareContext(context);
      context.code = this.getCode();
      context.uniqueDivId = zx.cms.content.Piece.getUniqueDivId();
    }
  }
});
