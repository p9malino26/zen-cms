qx.Class.define("zx.server.auth.UserDiscovery", {
  extend: qx.core.Object,

  members: {
    /**
     * Called once on startup to initialise the discovery mechanism
     */
    async initialise() {
      // Nothing
    },

    /**
     * Gets a user from the email address; returns null unless `create` is true, in which case
     * the user will be created if it does not already exist
     *
     * @param {String} email
     * @param {Boolean?} create
     * @return {zx.server.auth.User}
     */
    async getUserFromEmail(email, create) {
      let server = zx.server.Standalone.getInstance();
      let clazz = zx.server.auth.User.getUserClass();
      let user = await server.findOneObjectByType(clazz, {
        username: email.toLowerCase()
      });
      if (!user && create) {
        user = new clazz().set({
          username: email,
          fullName: ""
        });
        await user.save();
      }
      return user;
    }
  }
});
