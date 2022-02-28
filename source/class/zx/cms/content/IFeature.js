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
 * A content Feature is a simple wrapper that controls how code is delivered to the client,
 * it is able to control how the feature code is rendered at the server as part of the HTML
 * which is shipped to the client as part of the original .html request, and also how to
 * initialise the corresponding code on the thin client.
 *
 * It is not a requirement that the feature is able to render on both the client and the
 * server, although it can do both (and often will, if the goal is to avoid the flashing
 * that occurs when the client creates HTML after page load).
 *
 * The statics in `zx.cms.content.Features` contains a mechanism to track the IFeature
 * instances used for particular classes; it is expected that they can be reused, and so
 * they are cached.
 *
 * A feature can choose to implement the `zx.cms.content.IFeatureServerRender` and/or the
 * `zx.cms.content.IFeatureClientInstall` interfaces to control how they are used.
 *
 * Classes which are not Features can indicate the Feature class to use as their wrapper
 * by using the zx.cms.content.anno.Feature annotation
 */
qx.Interface.define("zx.cms.content.IFeature", {
  members: {
    /**
     * Called to render the server content of the feature
     *
     * @param {*} context the context object being built for Nunjucks
     * @param {zx.cms.rendering.Renderer} rendering
     * @param {*} options options which were configured on the page, for the piece
     */
    async prepareContext(context, rendering, options) {},

    /**
     * Called to render the server content of the feature
     *
     * @param {*} context the context object being built for Nunjucks
     * @param {zx.cms.rendering.Renderer} rendering
     * @param {*} options options which were configured on the page, for the piece
     */
    renderServer(context, rendering, options) {},

    /**
     * Called to render the client install of the feature; this is run on the server to
     * generate the code which will be executed on the client, so that the client can
     * "bootstrap" the feature on the client
     *
     * @param {zx.cms.rendering.Renderer} rendering
     * @param {*} options options which were configured on the page, for the piece
     */
    renderClientInstall(rendering, options) {}
  }
});
