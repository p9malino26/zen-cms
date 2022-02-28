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
 * The base class for content pages in the CMS
 *
 * @use(zx.cms.content.PageController)
 * @asset(zx/cms/content/*)
 */
qx.Class.define("zx.cms.content.Page", {
  extend: zx.io.persistence.Object,
  implement: [
    zx.cms.render.IViewable,
    zx.io.remote.IProxied,
    zx.io.persistence.IObjectNotifications
  ],
  include: [zx.server.MObjectLastModified],
  "@": [
    new zx.io.remote.anno.Class().set({ clientMixins: "zx.cms.content.MPage" }),
    zx.server.anno.LastModified.DEFAULT
  ],

  construct() {
    this.base(arguments);
    this.setPieces(new qx.data.Array());
    this.setDecorators(new qx.data.Array());
  },

  properties: {
    uuid: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeUuid",
      "@": [zx.io.remote.anno.Property.DEFAULT]
    },

    /** Title of the page */
    title: {
      init: "Untitled Page",
      check: "String",
      event: "changeTitle",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /**
     * The URL of the page
     */
    url: {
      init: "untitled-page",
      check: "String",
      event: "changeUrl",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
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

    /** Layout used to present this page */
    layout: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeLayout",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** CSS Class to apply */
    cssClass: {
      init: "",
      check: "String",
      event: "changeCssClass",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    },

    /** List of all decorators to apply during the request
     * @type{qx.data.Array<String>}
     */
    decorators: {
      check: "qx.data.Array",
      event: "changeDecorators",
      "@": [
        zx.io.persistence.anno.Property.DEFAULT,
        zx.io.remote.anno.Property.DEFAULT
      ]
    }
  },

  members: {
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
    receiveDataNotification(key, data) {
      if (key == zx.io.persistence.IObjectNotifications.DATA_LOAD_COMPLETE) {
        if (!this.getUuid()) this.setUuid(this.toUuid());
      }
    },

    /**
     * @Override
     */
    async prepareContext(context, rendering) {
      context.page = {
        title: this.getTitle(),
        lastModified: this.getLastModified(),
        _instance: this,
        pieces: [],
        cssClass: this.getCssClass()
      };
      context.uuid = this.getUuid();
      for (let i = 0, arr = this.getDecorators(); i < arr.getLength(); i++) {
        let name = arr.getItem(i);
        let clazz = qx.Class.getByName(name);
        if (!clazz) {
          this.error(
            `Cannot create decorator class ${name} because it does not exist`
          );
          return;
        }
        let instance = new clazz();
        await instance.prepareContext(context, rendering, this);
      }

      for (let i = 0; i < this.getPieces().getLength(); i++) {
        let piece = this.getPieces().getItem(i);
        let ctlr = zx.cms.render.Controller.getController(piece);
        let templateName = ctlr.getTemplateName(piece);
        let pieceContext = zx.cms.render.Renderer.createContext(context, this);
        pieceContext._templateName = piece.classname + ":" + templateName;
        context.page.pieces.push(pieceContext);
        await piece.prepareContext(pieceContext, rendering);
      }
    },

    "@save": zx.io.remote.anno.Method.DEFAULT,
    save() {
      zx.server.Standalone.getInstance().putObject(this);
    }
  }
});
