/**
 * Command to flush the email queue.
 *
 * This command will attempt to send all emails in the queue, and remove the emails that have been successfully sent (if the clear-queue flag is set).
 */
qx.Class.define("zx.server.email.commands.FlushCommand", {
  extend: zx.cli.Command,
  construct() {
    super("flush");

    this.addFlag(
      new zx.cli.Flag("clear-queue").set({
        description: "Clear queue after sending?",
        type: "boolean",
        required: false,
        value: true
      })
    );

    this.setRun(async ({ flags, args }) => {
      await new zx.server.Standalone().start();

      await this.__doit(flags["clear-queue"]);
      console.log("Done.");
      return 0;
    });
  },

  members: {
    async __doit(clearQueue = true) {
      let emailsCollection = await zx.server.Standalone.getInstance().getDb().getCollection("zx.server.email.Message");

      let emailsCursor = await emailsCollection.find({});

      let toDeleteUuids = [];
      for await (const emailJson of emailsCursor) {
        let email = await zx.server.Standalone.getInstance().findOneObjectByType(zx.server.email.Message, { _uuid: emailJson._uuid }, false);
        let success = await email.sendEmail();
        if (success) {
          toDeleteUuids.push(email.toUuid());
        } else {
          console.error(`Failed to send email ${email.toUuid()}. Message: ${email.getLastErrorMessage()}`);
        }
      }

      if (clearQueue) {
        let server = zx.server.Standalone.getInstance();
        await server.deleteObjectsByType(zx.server.email.Message, { _id: { $in: toDeleteUuids } });
      }
    }
  }
});
