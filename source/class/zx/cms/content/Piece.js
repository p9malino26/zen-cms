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
  implement: [
    zx.cms.render.IViewable,
    zx.io.remote.IProxied,
    zx.io.persistence.IObjectNotifications
  ],
  "@": [
    new zx.io.remote.anno.Class().set({ clientMixins: "zx.cms.content.MPiece" })
  ],

  properties: {
    uuid: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeUuid",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** Title of the piece */
    pieceTitle: {
      init: null,
      nullable: true,
      check: "String",
      event: "changePieceTitle",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    }
  },

  members: {
    /**
     * @Override
     */
    receiveDataNotification(key, data) {
      if (key == zx.io.persistence.IObjectNotifications.DATA_LOAD_COMPLETE) {
        if (!this.getUuid()) {
          let uuid = qx.util.Uuid.createUuidV4();
          this.setUuid(uuid);
        }
      }
    },

    /**
     * @Override
     */
    async prepareContext(context, rendering) {
      context._instance = this;
      context.uuid = this.getUuid();
    }
  },

  statics: {
    getUniqueDivId() {
      return "piece-" + zx.cms.content.Piece.__nextUniqueDivId++;
    },

    __nextUniqueDivId: 1
  }
});
