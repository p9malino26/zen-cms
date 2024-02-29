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
     * @param {zx.server.email.Message} message zx.server.email.Message or alike
     * @returns {boolean} If the email was successfully sent
     * @deprecated see `zx.server.email.Message.sendEmail`
     */
    async attemptSendEmail(message) {
      await message.sendEmail();
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
