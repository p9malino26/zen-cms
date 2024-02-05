const fs = require("fs").promises;

/**
 * Used for managing the emailJs library
 * https://github.com/eleith/emailjs
 */
qx.Class.define("zx.server.email.EmailJS", {
  statics: {
    /**@type {emailjs} */
    __emailJs: null,

    /**@returns {emailjs} */
    getInstance() {
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
    }
  }
});
