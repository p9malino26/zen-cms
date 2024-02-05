qx.Class.define("zx.cli.puppeteer.PuppeteerCommand", {
  extend: qx.core.Object,

  members: {},

  statics: {
    createCliCommand() {
      let cmd = new zx.cli.Command("puppeteer").set({
        description: "Utility commands for working with puppeteer and chromium"
      });

      cmd.addSubcommand(zx.cli.puppeteer.ScreenshotCommand.createCliCommand());

      let sub = new zx.cli.Command("hold").set({
        description: `Holds Chromium in a container for testing and mdebugging`,
        async run() {
          const { args, flags } = this.getValues();
          if (flags.config) {
            let dockerConfig = zx.server.puppeteer.ChromiumDocker.getConfiguration();
            let data = await zx.utils.Json.loadJsonAsync(flags.config);
            qx.lang.Object.mergeWith(dockerConfig, data, true);
          }

          try {
            let chromium = await zx.server.puppeteer.ChromiumDocker.acquire();
            this.info("ChromiumDocker aquired");

            let puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
              url: "http://www.google.co.uk",
              chromiumEndpoint: chromium.getEndpoint()
            });

            this.info("Puppeteer client created");

            await puppeteer.start();
            this.info("Puppeteer client started");

            let stop = flags.timeout > 0 ? new Date().getTime() + flags.timeout * 1000 : 0;
            let containerRunning = true;
            while (true) {
              await zx.utils.Promisify.waitFor(flags.timeout * 1000);
              containerRunning = await chromium.isContainerRunning();
              if (!containerRunning) {
                this.info("Chromium container stopped");
                break;
              }
              if (stop > 0 && stop > new Date().getTime()) {
                this.info("Timeout reached");
                break;
              }
            }

            this.info("Shutting down");

            if (!containerRunning) {
              puppeteer.kill();
            }
            await puppeteer.stop();
            puppeteer.dispose();
            this.info("Puppeteer client stopped");

            if (containerRunning) {
              await chromium.destroyContainer();
            }
            chromium.dispose();
            this.info("Chromium released");
          } catch (ex) {
            console.error("Exception in client: " + (ex.stack || ex));
          }
        }
      });

      sub.addFlag(
        new zx.cli.Flag("timeout").set({
          shortCode: "t",
          description: "timeout to wait in seconds (0 = forever)",
          value: 0,
          type: "integer"
        })
      );

      sub.addFlag(
        new zx.cli.Flag("config").set({
          shortCode: "c",
          description: "launch configuration file",
          type: "string"
        })
      );

      cmd.addSubcommand(sub);

      return cmd;
    }
  }
});
