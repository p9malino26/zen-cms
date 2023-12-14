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
 * All views are derived from this class.
 */
qx.Class.define("zx.cms.render.View", {
  extend: qx.core.Object,

  members: {
    /**
     * Renders a viewable onto a stream.  Note that viewable may be null, eg in the case of
     * system pages
     *
     * @param rendering {zx.cms.render.IRendering} the rendering transport
     * @param viewable {IViewable?} the object to view
     * @param context {Object?} additional context object for rendering
     */
    async render(rendering, viewable, context) {
      throw new Error("No such implementation for " + this.classname + ".render");
    }
  }
});
