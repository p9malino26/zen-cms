qx.Class.define("zx.cli.puppeteer.PuppeteerCommand", {
  extend: qx.core.Object,

  members: {},

  statics: {
    createCliCommand() {
      let cmd = new zx.cli.Command("puppeteer").set({
        description: "Utility commands for working with puppeteer and chromium"
      });

      cmd.addSubcommand(zx.cli.puppeteer.ScreenshotCommand.createCliCommand());

      return cmd;
    }
  }
});
