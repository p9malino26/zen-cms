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
    subject: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeSubject"
    },
    htmlBody: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeHtmlBody",
      init: null,
      nullable: true
    },
    textBody: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeTextBody",
      init: null,
      nullable: true
    },

    sendAttempts: {
      check: "Integer",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeSendAttempts",
      init: 0
    },

    lastErrorMessage: {
      check: "String",
      "@": [zx.io.persistence.anno.Property.DEFAULT, zx.io.remote.anno.Property.PROTECTED],
      event: "changeLastErrorMessage",
      init: null,
      nullable: true
    }
  }
});
