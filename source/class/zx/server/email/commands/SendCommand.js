/**
 * Command used to composed and put an email into the queue
 */
qx.Class.define("zx.server.email.commands.SendCommand", {
  extend: zx.cli.Command,
  construct() {
    super("send");

    this.addArgument(
      new zx.cli.Argument("id").set({
        description: "User ID or UUID of Email To Send",
        type: "string",
        required: true
      })
    );

    this.addFlag(
      new zx.cli.Flag("delete-from-queue").set({
        description: "Delete email from queue after sending?",
        type: "boolean",
        required: false,
        value: true
      })
    );

    this.setRun(async ({ flags, args }) => {
      await new zx.server.Standalone().start();
      await this.__doit(args.id, flags["delete-from-queue"]);
      console.log("Done.");
      return 0;
    });

    return this;
  },

  members: {
    async __doit(userId, deleteFromQueue = true) {
      const Util = zx.server.email.commands.Util;

      let emailUuid;
      if (/^[0-9]+$/.test(userId)) {
        emailUuid = await Util.getEmailUuidByUserId(userId);
      } else {
        emailUuid = userId;
      }

      let server = zx.server.Standalone.getInstance();
      let email = await server.findOneObjectByType(zx.server.email.Message, { _uuid: emailUuid });

      let success = await Util.attemptSendEmail(email);

      if (success && deleteFromQueue) {
        let server = zx.server.Standalone.getInstance();
        await server.deleteObject(email);
      }

      if (!success) {
        console.error(`Failed to send email ${email.toUuid()}. Message: ${email.getLastErrorMessage()}`);
      }
    }
  }
});
