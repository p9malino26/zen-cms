const fs = require("fs").promises;

/**
 * Used for managing the emailJs SMTP client
 */
qx.Class.define("zx.server.email.SMTPClient", {
  statics: {
    /**@type {emailjs.SMTPClient} */
    __client: null,

    /**@returns {emailjs.SMTPClient} */
    getInstance() {
      if (!this.__client) {
        throw new Error("SMTPClient not initialized");
      }
      return this.__client;
    },

    /**
     * Initialises the SMTP client so that it can be fetched synchronously using getInstance
     * SMTP server settings are taken from the cms config file
     */
    async initialise() {
      const emailJs = zx.server.email.EmailJS.getInstance();
      const { SMTPClient } = emailJs;

      let config = await zx.server.Config.getConfig();

      let username = config.smtpServer.username;
      let password = config.smtpServer.password;

      const client = new SMTPClient({
        user: username,
        password: password,
        host: config.smtpServer.host,
        ssl: true
      });

      this.__client = client;
    }
  }
});
