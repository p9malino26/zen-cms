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
 * A Piece which is a container for multiple pieces; the container
 * supports only vertical or horizontal layouts
 *
 * @use(zx.cms.content.ContainerPieceController)
 */
qx.Class.define("zx.cms.content.ContainerPiece", {
  extend: zx.cms.content.Piece,
  "@": [
    new zx.io.remote.anno.Class().set({
      clientMixins: "zx.cms.content.MContainerPiece"
    })
  ],

  properties: {
    /** Orientation for presentation */
    orientation: {
      init: "vertical",
      check: ["horizontal", "vertical", "flow"],
      event: "changeOrientation",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Pieces in the Page */
    pieces: {
      nullable: false,
      check: "qx.data.Array",
      event: "changePieces",
      transform: "__transformPieces",
      "@": [
        zx.io.persistence.anno.Property.EMBED,
        zx.io.remote.anno.Property.DEFAULT,
        new zx.io.persistence.anno.Array().set({
          arrayType: zx.cms.content.Piece
        })
      ]
    },

    /** CSS Class to apply */
    cssClass: {
      init: "",
      check: "String",
      event: "changeCssClass",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Layout used to present this page */
    layout: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeLayout",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    /**
     * Transform for `pieces` property
     */
    __transformPieces(value, oldValue) {
      if (oldValue) {
        oldValue.replace(value ? value : []);
        return oldValue;
      }
      return value;
    },

    /**
     * @Override
     */
    async prepareContext(context, rendering) {
      await super.prepareContext(context);
      context.pieces = [];
      context.orientation = this.getOrientation();
      context.cssClass = this.getCssClass();
      for (let i = 0; i < this.getPieces().getLength(); i++) {
        let piece = this.getPieces().getItem(i);
        let ctlr = zx.cms.render.Controller.getController(piece);
        let templateName = ctlr.getTemplateName(piece);
        let pieceContext = zx.cms.render.Renderer.createContext(context, this);
        pieceContext._templateName = piece.classname + ":" + templateName;
        context.pieces.push(pieceContext);
        await piece.prepareContext(pieceContext, rendering);
      }
    }
  }
});
