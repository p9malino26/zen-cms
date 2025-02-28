qx.Class.define("zx.cli.commands.DemoCommand", {
  extend: zx.cli.Command,

  construct() {
    super("demo", "Utility commands for running demos");
    this.addSubcommand(new zx.cli.commands.demo.WorkerPoolsCommand());
  }
});
