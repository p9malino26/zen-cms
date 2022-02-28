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


qx.Class.define("zx.server.auth.LoginApi", {
  extend: zx.server.Object,
  "@": zx.io.remote.anno.Class.DEFAULT,

  members: {
    "@loginUser": zx.io.remote.anno.Method.DEFAULT,
    async loginUser(username, password, rememberMe) {
      let user = await zx.server.auth.User.getUserFromEmail(username);
      if (!user || user.getPassword() !== password) return { status: "error" };

      user.login(zx.server.WebServer.getCurrentRequest(), rememberMe);
      return { status: "ok" };
    },

    "@logout": zx.io.remote.anno.Method.DEFAULT,
    async logout() {
      let request = zx.server.WebServer.getCurrentRequest();
      await new qx.Promise(resolve => request.destroySession(resolve));
    },

    "@getCurrentUser": zx.io.remote.anno.Method.DEFAULT,
    async getCurrentUser() {
      let request = zx.server.WebServer.getCurrentRequest();
      let user = await zx.server.auth.User.getUserFromSession(request);
      return user;
    }
  }
});
