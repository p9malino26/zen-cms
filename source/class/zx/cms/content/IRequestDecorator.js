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

qx.Interface.define("zx.cms.content.IRequestDecorator", {
  members: {
    /**
     * Called to update the context during rendering
     *
     * @param {Object} context
     * @param {zx.cms.render.IRendering} rendering
     * @param {zx.cms.render.IViewable} viewable
     */
    prepareContext(context, rendering, viewable) {}
  }
});
