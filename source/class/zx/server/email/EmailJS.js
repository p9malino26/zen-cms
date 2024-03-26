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
      
      if (config.smtpServer.toAddressOverride) {
        let text = "";
        text += "ORIGINAL HEADERS:\n\n";
        text += `\tto: ${headers.to.join(",")}\n`;
        text += `\tcc: ${headers.cc.join(",")}\n`;
        text += `\tbcc: ${headers.bcc.join(",")}\n`;
        headers.text = text + (headers.text ?? "");
        headers.to = config.smtpServer.toAddressOverride;
        headers.cc = [];
        headers.bcc = [];
      } else if (qx.core.Environment.get("qx.debug")) {
        this.warn(
          "Running in development environment without setting a toAddressOverride - the following email addresses will be sent the email:" +
            `\tto: ${headers.to?.map(i => `<${i}>`).join(",") || "(no to address(es))"}\n` +
            `\tcc: ${headers.cc?.map(i => `<${i}>`).join(",") || "(no cc address(es))"}\n` +
            `\tbcc: ${headers.bcc?.map(i => `<${i}>`).join(",") || "(no bcc address(es))"}\n`
        );
        debugger;
      }
      let Message = this.__emailJs.Message;
      return new Message(headers);
    }
  }
});
