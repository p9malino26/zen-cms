/**
 * Used to render HTML emails in the browser and then send them
 */
qx.Class.define("zx.server.email.EmailRenderer", {
  statics: {
    /**
     * @param {string} url URL of the webpage with the email content
     */
    async run(url) {
      try {
        let chromium = await zx.server.puppeteer.ChromiumDocker.acquire();
        console.log("ChromiumDocker aquired");

        let puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
          url,
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
          

          zx.server.email.Message.compose({ from: parameters.from ?? null, to: parameters.to, subject: parameters.subject ?? null, htmlBody: html });
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
  }
});
