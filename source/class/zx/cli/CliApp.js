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
      await zx.utils.LogFilter.loadFiltersAutoDetect();
      await this.runCli();
    },

    /**
     * Called to run the command line
     */
    async runCli() {
      let rootCmd = this._createRootCommand();
      await rootCmd.execute();
    },

    /**
     * Creates the command for parsing the command line
     *
     * @returns {zx.cli.Command}
     */
    _createRootCommand() {
      let rootCmd = new zx.cli.Command("*");
      rootCmd.addSubcommand(zx.cli.commands.ServeCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.DbCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.GetCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.CreateProxiesCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.UserCommand.createCliCommand());
      rootCmd.addSubcommand(zx.test.cli.TestCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.ShortenCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.commands.LicenseCommand.createCliCommand());
      rootCmd.addSubcommand(zx.cli.puppeteer.PuppeteerCommand.createCliCommand());
      return rootCmd;
    }
  }
});
