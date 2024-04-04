/**
 * Used to render HTML emails in the browser and then send them
 */
qx.Class.define("zx.server.email.EmailRenderer", {
  statics: {
    /**
     * @param {string} url URL of the webpage with the email content
     * @param {(msg: string) => void | null} log Function to log messages
     */
    async run(url, log) {
      if (log === undefined) {
        log = console.log;
      }
      try {
        let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();

        let ctlr = new zx.server.puppeteer.PuppeteerController(zx.server.puppeteer.api.EmailServerApi).set({
          username: config.authUser,
          password: config.authTokens["grasshopper.automatedLogin"] || null
        });

        await ctlr.initialise(url);
        log("Initialised browser controller");

        let pptr = ctlr.getPuppeteer();
        await pptr.waitForReadySignal();
        log("Received ready signal");

        let api = ctlr.getApi();
        api.addListener("sendEmail", evt => {
          let { html, textBody, parameters } = evt.getData();
          log("Email body to send: " + html);
          log("Email parameters: " + JSON.stringify(parameters, null, 2));

          let attachments = null;
          if (parameters.attachments) {
            attachments = new qx.data.Array();
            for (let attachmentPojo of parameters.attachments) {
              let attachment = new zx.server.email.Attachment();
              attachment.set(attachmentPojo);
              attachments.push(attachment);
            }
          }

          if (typeof parameters.to == "array") {
            parameters.to = new qx.data.Array(parameters.to);
          }

          zx.server.email.Message.compose({ from: parameters.from ?? null, to: parameters.to, subject: parameters.subject ?? null, htmlBody: html, textBody, attachments });
          api.next();
        });

        await api.start();
        log("Started API");
        await ctlr.promiseFinished();
        log("Finished browser controller");
      } catch (ex) {
        console.error("Exception in client: " + (ex.stack || ex));
      }
    }
  }
});
