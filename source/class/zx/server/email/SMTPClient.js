const fs = require("fs").promises;

/**
 * Used for managing the emailJs SMTP client
 */
qx.Class.define("zx.server.email.SMTPClient", {
  statics: {
    /**@type {emailjs.SMTPClient} */
    __smtpClientImpl: null,

    /**@returns {emailjs.SMTPClient} */
    getSmtpClientImpl() {
      if (!this.__smtpClientImpl) {
        throw new Error("SMTPClient not initialized");
      }
      return this.__smtpClientImpl;
    },

    /**
     * Initialises the SMTP client so that it can be fetched synchronously using getInstance
     * SMTP server settings are taken from the cms config file
     */
    async initialise() {
      const emailJs = zx.server.email.EmailJS.getEmailJs();
      const { SMTPClient } = emailJs;

      let config = await zx.server.Config.getConfig();

      if (!config.smtpServer) {
        qx.log.Logger.error("No smtpServer configuration found in the cms config file - email sending will not work");
        return;
      }

      let username = config.smtpServer.username;
      let password = config.smtpServer.password;

      const client = new SMTPClient({
        user: username,
        password: password,
        host: config.smtpServer.host,
        port: config.smtpServer.port ?? undefined,
        ssl: config.smtpServer.ssl ?? false,
        tls: config.smtpServer.tls ?? false,
        timeout: config.smtpServer.timeout ?? undefined
      });

      this.__smtpClientImpl = client;
    }
  }
});
