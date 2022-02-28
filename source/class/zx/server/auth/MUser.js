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

qx.Mixin.define("zx.server.auth.MUser", {
  members: {
    hasPermission(code) {
      if (code instanceof zx.server.auth.Permission) code = code.getShortCode();
      if (this.getPermissions().lookup(code)) return true;
      if (this.getRoles().find(role => role.getPermissions().lookup(code)))
        return true;
      return false;
    },

    describe() {
      let str = (this.getFullName() || "").trim();
      if (str.length) return str + " (" + this.getUsername() + ")";
      return this.getUsername();
    },

    /**
     * @Override
     */
    toString() {
      return this.base(arguments) + "::" + this.getUsername();
    }
  }
});
