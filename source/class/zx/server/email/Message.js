/**
 * An email message that is queued for sending
 */
qx.Class.define("zx.server.email.Message", {
  extend: zx.server.Object,

  statics: {
    /**
     * Composes an email message and saves it in the queue
     * @param {{ to:string, from:string, subject:string, textBody?:string, htmlBody?:string }} params
     * @returns {zx.server.email.Message}
     */
    async compose(params) {
      let email = new zx.server.email.Message().set({ ...params, dateQueued: new Date() });
      await email.save();
      return email;
    }
  },

  properties: {
    /**Date when the email was put into the queue */
    dateQueued: {
      check: "Date",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeDateQueued"
    },

    /** From email address */
    from: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeFrom"
    },

    /** To email address */
    to: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeTo"
    },

    /** Email subject */
    subject: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeSubject"
    },

    /** HTML body of the email */
    htmlBody: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeHtmlBody",
      init: null,
      nullable: true
    },

    /** Text body of the email */
    textBody: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeTextBody",
      init: null,
      nullable: true
    },

    /** Number of times the email was attempted to be sent */
    sendAttempts: {
      check: "Integer",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeSendAttempts",
      init: 0
    },

    /** Last error message if the email was not sent */
    lastErrorMessage: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeLastErrorMessage",
      init: null,
      nullable: true
    }
  },

  members: {
    /**
     * @returns {boolean} If the email was successfully sent
     */
    async sendEmail() {
      let htmlBody = this.getHtmlBody();

      let config = await zx.server.Config.getConfig();

      let message = zx.server.email.EmailJS.createNewMessage({
        from: config.smtpServer.fromAddr,
        to: this.getTo(),
        subject: this.getSubject(),
        attachment: htmlBody ? [{ data: htmlBody, alternative: true }] : undefined,
        text: this.getTextBody(),
        "reply-to": this.getFrom()
      });

      let client = zx.server.email.SMTPClient.getSmtpClientImpl();
      let error = false;

      await client.sendAsync(message).catch(async err => {
        error = true;
        if (!(message instanceof zx.server.email.Message)) {
          let server = zx.server.Standalone.getInstance();
          message = await server.findOneObjectByType(zx.server.email.Message, { _uuid: this.toUuid() });
        }
        this.setSendAttempts(this.getSendAttempts() + 1);
        this.setLastErrorMessage(err ? err.message : null);
        this.save();
      });

      return !error;
    }
  }
});
