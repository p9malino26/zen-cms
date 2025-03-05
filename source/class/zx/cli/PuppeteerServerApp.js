/* ************************************************************************
 *
 *  Zenesis Puppeteer Server
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2022-23 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

const fs = require("fs-extra");
const path = require("path");

/**
 * Runs the server in the puppeteer docker VM
 *
 */
qx.Class.define("zx.cli.PuppeteerServerApp", {
  extend: qx.application.Basic,

  members: {
    async main() {
      qx.log.appender.Native;
      await zx.utils.LogFilter.loadFiltersAutoDetect();

      debugger;
      let rootCmd = new zx.cli.Command("*");
      rootCmd.addSubcommand(zx.cli.puppeteer.LaunchCommand.createCliCommand());
      rootCmd.addSubcommand(new zx.cli.commands.work.StartWorkerCommand());
      await rootCmd.execute();
    }
  }
});
