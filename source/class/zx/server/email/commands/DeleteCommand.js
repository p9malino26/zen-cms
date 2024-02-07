const readline = require("readline/promises");
/**
 * Command used to composed and put an email into the queue
 */
qx.Class.define("zx.server.email.commands.DeleteCommand", {
  extend: zx.cli.Command,
  construct() {
    super("delete");

    this.addArgument(
      new zx.cli.Argument("id").set({
        description: "User ID or UUID of Email To Delete",
        type: "string",
        required: false
      })
    );

    this.setRun(async ({ flags, args }) => {
      await new zx.server.Standalone().start();
      if (args.id) {
        await this.__deleteOne(args.id);
      } else {
        const reader = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const confirm = await reader.question("Are you sure you want to delete all emails? (yes/[no]) ");
        if (confirm === "yes") {
          await this.__deleteAll();
        } else {
          console.log("Abort.");
          return 0;
        }
      }
      console.log("Done.");
      return 0;
    });

    return this;
  },

  members: {
    async __deleteOne(userId) {
      const Util = zx.server.email.commands.Util;

      let emailUuid;
      if (/^[0-9]+$/.test(userId)) {
        emailUuid = await Util.getEmailUuidByUserId(userId);
      } else {
        emailUuid = userId;
      }

      let server = zx.server.Standalone.getInstance();
      await server.deleteObjectsByType(zx.server.email.Message, { _uuid: emailUuid });
    },

    async __deleteAll() {
      let server = zx.server.Standalone.getInstance();
      await server.deleteObjectsByType(zx.server.email.Message, {});
    }
  }
});
