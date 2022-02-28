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
 * Rich Text piece of content
 */
qx.Class.define("zx.cms.content.ContentPiece", {
  extend: zx.cms.content.Piece,
  "@": [
    new zx.io.remote.anno.Class().set({
      clientMixins: "zx.cms.content.MContentPiece"
    })
  ],

  properties: {
    /* HTML content, as a string */
    content: {
      init: "",
      check: "String",
      event: "changeContent",
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
    }
  },

  members: {
    /*
     * @Override
     */
    async prepareContext(context, rendering) {
      await this.base(arguments, context);
      context.content = this.getContent();
      context.cssClass = this.getCssClass();
    }
  }
});
