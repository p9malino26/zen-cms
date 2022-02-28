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

qx.Class.define("zx.cms.app.auth.LogoutFeature", {
  extend: qx.core.Object,
  implement: [zx.cms.content.IFeature],

  construct() {
    this.base(arguments, zx.thin.app.login.LoginForm);
  },

  members: {
    /**
     * @Override
     */
    async prepareContext(context, rendering, options) {
      if (rendering instanceof zx.cms.render.FastifyRendering) {
        let request = rendering.getRequest();
        await new qx.Promise(resolve => request.destroySession(resolve));
        rendering.getReply().redirect("/");
        rendering.stop();
      }
    },

    /**
     * @Override
     */
    renderServer(context, rendering, options) {},

    renderClientInstall(rendering, options) {
      return "";
    }
  }
});
