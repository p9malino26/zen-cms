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
 * Classes which render on the server must implement this if they are to be
 * used with `zx.cms.content.SimpleFeature` (otherwise they must provide their
 * own implementation of `zx.cms.content.IFeature`)
 */
qx.Interface.define("zx.cms.content.IFeatureServerRender", {
  members: {
    /**
     * Called during the prepareContext phase
     *
     * @param {Object} context
     * @param {zx.cms.content.IRendering} rendering
     * @param {*} options
     */
    async prepareContext(context, rendering, options) {},

    /**
     * Renders the html on the server
     *
     * @param targetClass {Class} the class to be rendered
     * @param options {*} options which were configured on the piece, on the page
     * @return {String} the output
     */
    renderServer(targetClass, context, rendering, options) {},

    /**
     * Renders the html on the server that is used to initialise the client.  If this returns null,
     * then the default client rendering will be used.  Return an empty string to suppress any client
     * installation
     *
     * @param clientInstallerClassname {Class} the class to be rendered
     * @param options {*} options which were configured on the piece, on the page
     * @return {String} the output
     */
    renderClientInstall(clientInstallerClassname, options) {}
  }
});
