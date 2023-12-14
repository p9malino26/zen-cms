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
 * IViewable objects are objects that can be rendered by a View; for example,
 * a Page is IViewable and operated by a PageController
 */
qx.Interface.define("zx.cms.render.IViewable", {
  members: {
    async prepareContext(context, rendering) {}
  }
});
