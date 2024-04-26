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
  implement: [zx.cms.render.IViewable, zx.io.remote.IProxied, zx.io.persistence.IObjectNotifications],
  include: [zx.server.MObjectLastModified],
  "@": [
    new zx.io.remote.anno.Class().set({ clientMixins: "zx.cms.content.MPage" }),
    new zx.io.persistence.anno.Class().set({ collectionName: "zx.cms.content.Page" }),
    zx.server.anno.LastModified.DEFAULT
  ],

  construct() {
    super();
    this.setPieces(new qx.data.Array());
    this.setDecorators(new qx.data.Array());
  },

  properties: {
    /** Title of the page */
    title: {
      init: "Untitled Page",
      check: "String",
      event: "changeTitle",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** The URL of the page */
    url: {
      init: "untitled-page",
      check: "String",
      event: "changeUrl",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Hero content for the page */
    hero: {
      init: null,
      nullable: true,
      check: "zx.cms.content.Piece",
      event: "changeHero",
      "@": [zx.io.persistence.anno.Property.EMBED, zx.io.remote.anno.Property.DEFAULT]
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
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** CSS Class to apply */
    cssClass: {
      init: "",
      check: "String",
      event: "changeCssClass",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** List of all decorators to apply during the request
     * @type{qx.data.Array<String>}
     */
    decorators: {
      check: "qx.data.Array",
      event: "changeDecorators",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
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
    async prepareContext(context, rendering) {
      context.page = {
        title: this.getTitle(),
        lastModified: this.getLastModified(),
        _instance: this,
        hero: null,
        pieces: [],
        cssClass: this.getCssClass()
      };

      context.uuid = this.toUuid();
      for (let i = 0, arr = this.getDecorators(); i < arr.getLength(); i++) {
        let name = arr.getItem(i);
        let clazz = qx.Class.getByName(name);
        if (!clazz) {
          this.error(`Cannot create decorator class ${name} because it does not exist`);
          return;
        }
        let instance = new clazz();
        await instance.prepareContext(context, rendering, this);
      }

      const createContextForPiece = async piece => {
        let ctlr = zx.cms.render.Controller.getController(piece);
        let templateName = ctlr.getTemplateName(piece);
        let pieceContext = zx.cms.render.Renderer.createContext(context, this);
        pieceContext._templateName = piece.classname + ":" + templateName;
        await piece.prepareContext(pieceContext, rendering);
        return pieceContext;
      };

      let hero = this.getHero();
      if (hero) {
        context.page.hero = await createContextForPiece(hero);
      }

      for (let i = 0; i < this.getPieces().getLength(); i++) {
        let piece = this.getPieces().getItem(i);
        let pieceContext = await createContextForPiece(piece);
        context.page.pieces.push(pieceContext);
      }
    },

    /**
     * @Override
     */
    async receiveDataNotification(key, data) {
      if (key == zx.io.persistence.IObjectNotifications.WRITE_TO_JSON_COMPLETE) {
        data.websiteName = zx.server.Standalone.getInstance().getWebsiteName();
      }
    },

    "@save": zx.io.remote.anno.Method.DEFAULT,
    save() {
      zx.server.Standalone.getInstance().putObject(this);
    },

    /**
     * @Override
     */
    toString() {
      return this.toUuid() + " :: " + this.getUrl();
    }
  }
});
