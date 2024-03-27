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
        let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();

        let ctlr = new zx.server.puppeteer.PuppeteerController(zx.server.puppeteer.api.PngServerApi).set({
          username: config.authUser,
          password: config.authTokens["grasshopper.automatedLogin"] || null
        });

        await ctlr.initialise(url);

        let pptr = ctlr.getPuppeteer();
        await pptr.waitForReadySignal();

        let api = ctlr.getApi();
        api.addListener("sendEmail", evt => {
          let { html, textBody, parameters } = evt.getData();
          console.log("Email body to send: " + html);
          console.log("Email parameters: " + JSON.stringify(parameters, null, 2));

          zx.server.email.Message.compose({ from: parameters.from ?? null, to: parameters.to, subject: parameters.subject ?? null, htmlBody: html, textBody });
          api.next();
        });

        await api.start();
        await ctlr.promiseFinished();
      } catch (ex) {
        console.error("Exception in client: " + (ex.stack || ex));
      }
    }
  }
});
