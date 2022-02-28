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
 * Features can implement this so that `zx.cms.content.SimpleFeature` will notify
 * it with lifecycle events
 */
qx.Interface.define("zx.cms.content.IFeatureServerLifecycle", {
  members: {
    /**
     * Called during the prepareContext phase
     *
     * @param {Object} context
     * @param {zx.cms.content.IRendering} rendering
     * @param {*} options
     */
    async prepareContext(context, rendering, options) {}
  }
});
