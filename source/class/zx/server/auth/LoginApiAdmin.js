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


qx.Class.define("zx.server.auth.LoginApiAdmin", {
  extend: zx.server.Object,
  "@": zx.io.remote.anno.Class.DEFAULT,

  members: {
    "@getUserByUuid": zx.io.remote.anno.Method.DEFAULT,
    async getUserByUuid(uuid) {
      let server = zx.server.Standalone.getInstance();
      let clazz = zx.server.auth.User.getUserClass();
      let user = await server.findOneObjectByType(clazz, { _uuid: uuid });
      return user;
    },

    "@search": zx.io.remote.anno.Method.DEFAULT,
    async search(partial) {
      function escapeRegexp(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      }
      let db = zx.server.Standalone.getInstance().getDb();
      let clazz = zx.server.auth.User.getUserClass();
      let query = {
        _classname: clazz.classname,
        username: { $regex: partial, $options: "i" }
      };
      let results = await db.find(query, {
        username: 1,
        fullName: 1,
        _uuid: 1
      });
      results = await results.limit(200).toArray();
      return results;
    },

    "@createImpersonateCode": zx.io.remote.anno.Method.DEFAULT,
    async createImpersonateCode(user, redirectTo) {
      let currentUser = await zx.server.auth.User.getUserFromSession();
      if (!currentUser.hasPermission("zx-super-user")) {
        this.error(
          `Cannot impersonate ${user} because this user (${currentUser}) is does not have suitable permissions`
        );
        return null;
      }
      if (user.hasPermission("zx-super-user")) {
        this.error(
          `Cannot impersonate ${user} because their permissions prevent it (they are a super user)`
        );
        return null;
      }

      let data = {
        username: user.getUsername(),
        timeNow: new Date().getTime()
      };
      if (redirectTo) data.redirectTo = redirectTo;

      let shortUrl = new zx.cms.system.ShortUrl().set({
        url: "zx/impersonate/" + qx.util.Uuid.createUuidV4(),
        type: "impersonate",
        title: "Impersonate " + user.getUsername(),
        value: JSON.stringify(data)
      });
      await shortUrl.allocateShortCode();
      await shortUrl.save();
      return {
        status: "ok",
        shortCode: shortUrl.getShortCode()
      };
    },

    "@createUser": zx.io.remote.anno.Method.DEFAULT,
    async createUser(username, fullName, password) {
      debugger;
      let user = await zx.server.auth.User.getUserFromEmail(username);
      let status = null;
      if (user) {
        status = "exists";
      } else {
        user = await zx.server.auth.User.getUserFromEmail(username, true);
        if (fullName) user.setFullName(fullName);
        if (password) user.setPassword(password);
        await user.save();
        status = "ok";
      }

      let db = zx.server.Standalone.getInstance().getDb();
      let query = {
        _uuid: user.toUuid()
      };
      let json = await db.findOne(query, {
        username: 1,
        fullName: 1,
        _uuid: 1
      });

      return {
        status: status,
        user: json
      };
    },

    "@setUserPassword": zx.io.remote.anno.Method.DEFAULT,
    async setUserPassword(user, password) {
      password = (password || "").trim();
      user.setPassword(password);
      user.save();
      return {
        status: "ok"
      };
    },

    "@deleteUser": zx.io.remote.anno.Method.DEFAULT,
    async deleteUser(user) {
      await user.deleteFromDatabase();
    }
  }
});
