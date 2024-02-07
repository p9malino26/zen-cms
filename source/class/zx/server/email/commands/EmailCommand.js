/*
 * @use(visionmedia.leaflets.LeafletEmailWebpage)
 */

/**
 * Command to manage the queueing and sending of emails.
 */
qx.Class.define("zx.server.email.commands.EmailCommand", {
  extend: zx.cli.Command,

  construct() {
    super("email");
    this.set({ description: "Manage emails" });
    this.addSubcommand(new zx.server.email.commands.ComposeCommand());
    this.addSubcommand(new zx.server.email.commands.FlushCommand());
    this.addSubcommand(new zx.server.email.commands.SendCommand());
    this.addSubcommand(new zx.server.email.commands.ShowQueueCommand());
    this.addSubcommand(new zx.server.email.commands.DeleteCommand());
  }
});
