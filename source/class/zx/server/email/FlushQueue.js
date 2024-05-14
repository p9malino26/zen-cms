/**
 * This class provides a method for flushing the email queue and sending the emails.
 */
qx.Class.define("zx.server.email.FlushQueue", {
  extend: qx.core.Object,
  include: [zx.utils.MConsoleLog],
  members: {
    /**
     * Flushes the email queue and attempts to send all emails.
     *
     * @param {boolean} clearQueue If true, we will delete emails that have been successfully sent from the queue.
     *  Otherwise, all emails (even the sent ones) will remain in the queue.
     *  Useful for testing.
     */
    async run(clearQueue = true) {
      let emailsCollection = await zx.server.Standalone.getInstance().getDb().getCollection("zx.server.email.Message");

      let emailsCursor = await emailsCollection.find({});

      let toDeleteUuids = [];
      for await (const emailJson of emailsCursor) {
        let email = await zx.server.Standalone.getInstance().findOneObjectByType(zx.server.email.Message, { _uuid: emailJson._uuid }, false);
        let success = await email.sendEmail();
        if (success) {
          this.log(`Email ${email.toUuid()} sent successfully: ${success}`);
          toDeleteUuids.push(email.toUuid());
        } else {
          this.log(`ERROR: Failed to send email ${email.toUuid()}. Message: ${email.getLastErrorMessage()}`);
        }
      }

      if (clearQueue) {
        let server = zx.server.Standalone.getInstance();
        await server.deleteObjectsByType(zx.server.email.Message, { _id: { $in: toDeleteUuids } });
      }
      this.log("Email queue flushed");
    }
  }
});
