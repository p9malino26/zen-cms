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
      event: "changeFrom",
      nullable: true,
      init: null
    },

    /** To email address(es) */
    to: {
      validate(value) {
        this.__isMaybeArrayString(value, "to");
      },
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeTo"
    },

    /** CC email address(es) */
    cc: {
      validate(value) {
        value === null || this.__isMaybeArrayString(value, "cc");
      },
      init: null,
      nullable: true,
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeCc"
    },

    /** BCC email address(es) */
    bcc: {
      validate(value) {
        value === null || this.__isMaybeArrayString(value, "bcc");
      },
      init: null,
      nullable: true,
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeBcc"
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

    /** Attachments for the email */
    attachments: {
      validate(value) {
        value === null || this.__isAttachmentArray(value, "attachments");
      },
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeAttachments",
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
    __isMaybeArrayString(value, propName) {
      if (typeof value === "string" || (value instanceof qx.data.Array && value.every(v => typeof v === "string"))) {
        return;
      }
      throw new qx.core.ValidationError(
        `Validation Error: value for property '${propName}' of class '${this.classname}' must either be a string, or an array of strings. Found ${value?.toString?.() ?? value}`
      );
    },

    __isAttachmentArray(value, propName) {
      if (value instanceof qx.data.Array && value.every(v => v instanceof zx.server.email.Attachment)) {
        return;
      }
      throw new qx.core.ValidationError(
        `Validation Error: value for property '${propName}' of class '${this.classname}' must be an array of zx.server.email.Attachment. Found ${value?.toString?.() ?? value}`
      );
    },

    /**
     * @returns {boolean} If the email was successfully sent
     */
    async sendEmail() {
      let htmlBody = this.getHtmlBody();

      let config = await zx.server.Config.getConfig();

      let mime = (await import("mime")).default;
      let attachmentDatas = [{ data: htmlBody, alternative: true }];
      if (this.getAttachments()) {
        this.getAttachments().forEach(attachment => {
          let filename = attachment.getPath();
          let stream = fs.createReadStream(filename);
          let attachmentData = {};
          if (stream) {
            attachmentData.stream = stream;
          } else {
            attachmentData.path = filename;
          }

          let fileExt = path.extname(filename);
          if (fileExt.startsWith(".")) {
            fileExt = fileExt.substring(1);
            let mimeType = mime.getType(fileExt);
            if (mimeType) {
              attachmentData.type = mimeType;
            }
          }

          attachmentData.name = attachment.getName() || path.basename(filename);
          attachmentDatas.push(attachmentData);
        });
      }

      let message = zx.server.email.EmailJS.createNewMessage({
        from: config.smtpServer.fromAddr,
        to: this.getTo(),
        cc: this.getCc(),
        bcc: this.getBcc(),
        subject: this.getSubject(),
        attachment: attachmentDatas,
        text: this.getTextBody(),
        ...(this.getFrom() ? { "reply-to": this.getFrom() } : {})
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
