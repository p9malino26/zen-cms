const fs = require("fs");
const path = require("path");

/**
 * @typedef EmailParameters
 * @property {String} from the email address to send from, if supported
 * @property {String} to the email address to send to
 * @property {String[]} cc the email addresses to CC
 * @property {String[]} bcc the email addresses to BCC
 * @property {String} subject the subject of the email
 * @property {String} priority the priority of the email
 * @property {Array<{ name: string; path: string; } | zx.server.email.Attachment>} attachments the attachments to send
 */

/**
 * An email message that is queued for sending
 */
qx.Class.define("zx.server.email.Message", {
  extend: zx.server.Object,

  properties: {
    /**
     * Name of the website that the email is being sent from
     * Set from zx.server.Standalone.getInstance().getWebsiteName()
     */
    websiteName: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      init: null,
      nullable: true,
      event: "changeWebsiteName"
    },
    /**
     * Date when the email was put into the queue
     */
    dateQueued: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "Date",
      event: "changeDateQueued"
    },

    /**
     * Date when the email was successfully delivered
     */
    dateDelivered: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "Date",
      event: "changeDateDelivered",
      nullable: true,
      init: null
    },

    /**
     * From email address
     */
    from: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeFrom",
      nullable: true,
      init: null
    },

    /**
     * To email address(es)
     * @type {qx.data.Array<string>} read value
     */
    to: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      transform: "__ensureQxArray",
      check(value) {
        return this.__isStringArray(value);
      },
      event: "changeTo"
    },

    /**
     * CC email address(es)
     * @type {qx.data.Array<string>} read value
     */
    cc: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      transform: "__ensureQxArray",
      check(value) {
        return this.__isStringArray(value);
      },
      init: null,
      nullable: true,
      event: "changeCc"
    },

    /**
     * BCC email address(es)
     * @type {qx.data.Array<string>} read value
     */
    bcc: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      transform: "__ensureQxArray",
      check(value) {
        return this.__isStringArray(value);
      },
      init: null,
      nullable: true,
      event: "changeBcc"
    },

    /**
     * Email subject
     */
    subject: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeSubject"
    },

    /**
     * HTML body of the email
     */
    htmlBody: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeHtmlBody",
      init: null,
      nullable: true
    },

    /**
     * Text body of the email
     */
    textBody: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeTextBody",
      init: null,
      nullable: true
    },

    /**
     * Attachments for the email
     * @type {qx.data.Array<zx.server.email.Attachment>}
     */
    attachments: {
      "@": [zx.io.persistence.anno.Property.EMBED, zx.io.remote.anno.Property.PROTECTED],
      check: "qx.data.Array",
      event: "changeAttachments",
      init: null,
      nullable: true
    },

    /**
     * Last error message if the email was not sent
     */
    lastErrorMessage: {
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      check: "String",
      event: "changeLastErrorMessage",
      init: null,
      nullable: true
    }
  },

  members: {
    /* PROPERTY CHECK/TRANSFORM */
    __isStringArray(value) {
      return value instanceof qx.data.Array && value.every(v => typeof v === "string");
    },

    __isAttachmentArray(value) {
      return value instanceof qx.data.Array && value.every(v => v instanceof zx.server.email.Attachment);
    },

    __ensureQxArray(value) {
      if (!Array.isArray(value) && !(value instanceof qx.data.Array) && value !== null) {
        value = [value];
      }
      if (Array.isArray(value)) {
        return new qx.data.Array(value);
      }
      return value;
    },

    /**
     * @param {(message: string) => void} [log] Callback for logging
     * @returns {Promise<boolean>} If the email was successfully sent
     */
    async sendEmail(log) {
      if (log === undefined) {
        log = console.log;
      }
      let htmlBody = this.getHtmlBody();

      let config = await zx.server.Config.getConfig();
      if (!config.smtpServer) {
        throw new Error("SMTP server configuration not found in cms.json");
      }

      /** @type {Array<Record<keyof any, any>>} */
      let attachmentsData = [{ data: htmlBody, alternative: true }];
      log("Before getting attachments");
      if (this.getAttachments()) {
        let mime = (await import("mime")).default;
        this.getAttachments().forEach(attachment => {
          let filename = attachment.getPath();
          let stream = fs.createReadStream(filename);
          let attachmentData = {};
          if (stream) {
            attachmentData.stream = stream;
          } else {
            attachmentData.path = filename;
          }

          if (attachment.getContentType()) {
            attachmentData.type = attachment.getContentType();
          } else {
            let fileExt = path.extname(filename);
            if (fileExt.startsWith(".")) {
              fileExt = fileExt.substring(1);
              let mimeType = mime.getType(fileExt);
              if (mimeType) {
                attachmentData.type = mimeType;
              }
            }
          }

          attachmentData.name = attachment.getName() || path.basename(filename);
          attachmentsData.push(attachmentData);
        });
      }

      log("Before getting creating emailJsMessage");

      let emailConfig = {
        to: this.getTo(),
        cc: this.getCc(),
        bcc: this.getBcc(),
        subject: this.getSubject(),
        attachment: attachmentsData,
        text: this.getTextBody(),
        ...(this.getFrom() ? { "reply-to": this.getFrom() } : {})
      };
      if (config.smtpServer.fromAddr) {
        emailConfig.from = config.smtpServer.fromAddr;
      }
      let emailJsMessage = zx.server.email.EmailJS.createNewMessage(emailConfig);

      let client = zx.server.email.SMTPClient.getSmtpClientImpl();
      let error = false;

      try {
        log("Before sending message via emailJs");
        await client.sendAsync(emailJsMessage);
        this.setDateDelivered(new Date());
        await this.save();
        log("After sending message via emailJs");
      } catch (err) {
        error = true;
        if (!(emailJsMessage instanceof zx.server.email.Message)) {
          let server = zx.server.Standalone.getInstance();
          emailJsMessage = await server.findOneObjectByType(zx.server.email.Message, { _uuid: this.toUuid() });
        }
        this.error(`Error sending email with UUID: ${this.toUuid()}. Stack: ${err?.stack ?? "(no stack trace)"}`);
        this.setLastErrorMessage(err ? err.message : "Unknown error when sending email");
        await this.save();
      }

      return !error;
    }
  },

  statics: {
    /**
     * Composes an email message and saves it in the queue
     * @param {{ parameters?: EmailParameters; textBody?: string; htmlBody?: string; }} params
     * @returns {Promise<zx.server.email.Message>}
     */
    async compose({ parameters, textBody, htmlBody }) {
      let websiteName = zx.server.Standalone.getInstance().getWebsiteName();
      let email = new zx.server.email.Message().set({ ...parameters, textBody, htmlBody, dateQueued: new Date(), websiteName });
      await email.save();
      return email;
    }
  }
});
