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

qx.Class.define("zx.cms.content.FeaturePiece", {
  extend: zx.cms.content.Piece,

  properties: {
    pieceTitle: {
      refine: true,
      init: "Feature"
    },

    /** Class name of the feature */
    featureName: {
      init: "",
      check: "String",
      event: "changeFeatureName",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** CSS Class to apply */
    cssClass: {
      init: "",
      check: "String",
      event: "changeCssClass",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    },

    /** Options to be passed to the feature */
    options: {
      init: null,
      nullable: true,
      event: "changeOptions",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.DEFAULT]
    }
  },

  members: {
    async prepareContext(context, rendering) {
      await super.prepareContext(context, rendering);
      context.featureName = this.getFeatureName();
      context.feature = zx.cms.content.Features.getFeature(this.getFeatureName());

      context.cssClass = this.getCssClass();
      context.uniqueDivId = zx.cms.content.Piece.getUniqueDivId();
      let options = this.getOptions();
      await context.feature.prepareContext(context, rendering, options);
      context.html = () => {
        return context.feature.renderServer(context, rendering, options) || "";
      };
      context.clientInstall = () => {
        return context.feature.renderClientInstall(rendering, options) || "";
      };
    }
  }
});
