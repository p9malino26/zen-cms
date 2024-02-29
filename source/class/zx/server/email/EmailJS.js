const fs = require("fs").promises;

/**
 * Used for managing the emailJs library
 * https://github.com/eleith/emailjs
 */
qx.Class.define("zx.server.email.EmailJS", {
  statics: {
    /**@type {emailjs} */
    __emailJs: null,
    __config: null,

    /**@returns {emailjs} */
    getEmailJs() {
      if (!this.__emailJs) {
        throw new Error("EmailJS not initialized");
      }
      return this.__emailJs;
    },

    /**
     * Initialises the emailJs library so that it can be fetched synchronously using getEmailJs
     */
    async initialise() {
      this.__emailJs = await import("emailjs");
      this.__config = await zx.server.Config.getConfig();
    },

    /**
     * @param {Partial<emailjs.MessageHeaders>} headers
     * @returns {emailjs.Message}
     */
    createNewMessage(headers) {
      let config = this.__config;
      if (config.toAddressOverride) {
        headers.to = config.toAddressOverride;
      }

      let Message = this.__emailJs.Message;
      return new Message(headers);
    }
  }
});
