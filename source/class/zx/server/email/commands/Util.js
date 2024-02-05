/**
 * Functions shared across all the command classes in zx.server.email.commands
 */
qx.Class.define("zx.server.email.commands.Util", {
  statics: {
    /**
     *
     * @param {string} userId Index of email in the queue, assuming queue is sorted by dateQueued descending
     * @returns {string}
     */
    async getEmailUuidByUserId(userId) {
      let emailsCollection = zx.server.Standalone.getInstance().getDb().getCollection("zx.server.email.Message");
      const sort = { dateQueued: -1 };
      let emails = await emailsCollection.find({}, { sort, projection: { _uuid: 1 } }).toArray();
      return emails[userId - 1]._uuid;
    },

    /**
     * @param {zx.server.email.Message} email zx.server.email.Message or alike
     * @returns {boolean} If the email was successfully sent
     */
    async attemptSendEmail(email) {
      const { Message } = zx.server.email.EmailJS.getInstance();

      let htmlBody = email.getHtmlBody();

      let config = await zx.server.Config.getConfig();

      const message = new Message({
        from: email.getFrom(),
        to: email.getTo(),
        subject: email.getSubject(),
        attachment: [{ data: htmlBody, alternative: true }],
        text: "Cannot show HTML email",
        "reply-to": config.smtpServer.replyTo
      });

      let client = zx.server.email.SMTPClient.getInstance();
      let error = false;

      await client.sendAsync(message).catch(async err => {
        error = true;
        if (!(email instanceof zx.server.email.Message)) {
          let server = zx.server.Standalone.getInstance();
          email = await server.findOneObjectByType(zx.server.email.Message, { _uuid: email.toUuid() });
        }
        email.setSendAttempts(email.getSendAttempts() + 1);
        email.setLastErrorMessage(err ? err.message : null);
        email.save();
      });

      return !error;
    },

    async getAllEmailsJson() {
      let emailsCollection = (await zx.server.Standalone.getInstance()).getDb().getCollection("zx.server.email.Message");
      const sort = { dateQueued: -1 };
      let emails = await emailsCollection.find({}, { sort }).toArray();

      emails.forEach((email, index) => (email.userId = index + 1));
      return emails;
    }
  }
});
