/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2022 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */



const path = require("path");

/**
 * @use(zx.cli.CreateProxiesCommand)
 * @use(zx.cli.GetCommand)
 * @use(zx.cli.ServeCommand)
 * @use(zx.cli.UserCommand)
 * @use(zx.test.cli.TestCommand)
 * @use(zx.utils.Readline)
 * @asset(zx/cli/*)
 */
qx.Class.define("zx.cli.CliApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      qx.log.appender.Native;
    },

    async runCli() {
      let rootCmd = new zx.cli.Command("*");
      rootCmd.addSubcommand(zx.cli.commands.ServeCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.GetCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.CreateProxiesCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.UserCommand.createCliCommand());
      rootCmd.addSubcommand(zx.test.cli.TestCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.ShortenCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.LicenseCommand.createCliCommand());

      let cmd = null;
      try {
        cmd = rootCmd.parseRoot();
      } catch (ex) {
        console.error("Error: " + ex.message);
      }
      let errors = (cmd && cmd.getErrors()) || null;
      if (errors) console.error(errors.join("\n"));

      let run = (cmd && cmd.getRun()) || null;
      if (!cmd || run === null || errors || cmd.getFlag("help").getValue()) {
        console.log((cmd || rootCmd).usage());
        process.exit(0);
      }
      let exitCode = await run.call(cmd, cmd);
      if (typeof exitCode == "number") process.exit(exitCode);
    }
  }
});
