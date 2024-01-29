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

/**
 */
qx.Class.define("zx.cli.puppeteer.EmailCommand", {
  extend: qx.core.Object,

  properties: {
    url: {
      check: "String"
    }
  },

  members: {
    /**
     * @Override
     */
    async run() {
      try {
        let chromium = await zx.server.puppeteer.ChromiumDocker.acquire();
        console.log("ChromiumDocker aquired");

        let puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
          url: this.getUrl(),
          chromiumEndpoint: chromium.getEndpoint()
        });

        console.log("Puppeteer client created");

        await puppeteer.start();
        console.log("Puppeteer client started");

        let api = puppeteer.createRemoteApi(zx.server.puppeteer.api.EmailServerApi);
        let promiseFinished = new qx.Promise();
        api.addListener("sendEmail", evt => {
          let { html, parameters } = evt.getData();
          console.log("Email body to send: " + html);
          console.log("Email parameters: " + JSON.stringify(parameters, null, 2));
          api.next();
        });
        api.addListener("complete", evt => promiseFinished.resolve());
        await api.start();
        console.log("Email API started");

        await promiseFinished;
        console.log("Email API completed");

        await puppeteer.stop();
        puppeteer.dispose();
        console.log("Puppeteer client stopped");

        await chromium.destroyContainer();
        chromium.dispose();
        console.log("Chromium released");
      } catch (ex) {
        console.error("Exception in client: " + (ex.stack || ex));
      }
    }
  },

  statics: {
    createCliCommand() {
      let cmd = new zx.cli.Command("email").set({
        description: "Uses Puppeteer to create an HTML email",
        async run() {
          let { flags, args } = this.getValues();
          if (flags.config) {
            let dockerConfig = zx.server.puppeteer.ChromiumDocker.getConfiguration();
            let data = await zx.utils.Json.loadJsonAsync(flags.config);
            qx.lang.Object.mergeWith(dockerConfig, data, true);
          }
          let cmd = new zx.cli.puppeteer.EmailCommand().set({
            url: args.url
          });

          return await cmd.run();
        }
      });

      cmd.addArgument(
        new zx.cli.Argument("url").set({
          description: "the url to visit",
          required: true
        })
      );

      cmd.addFlag(
        new zx.cli.Flag("config").set({
          shortCode: "c",
          description: "launch configuration file",
          type: "string"
        })
      );

      return cmd;
    }
  }
});
