/**
 * Used to render HTML emails in the browser and then send them
 */
qx.Class.define("zx.server.email.EmailRenderer", {
  statics: {
    /**
     * @param {string} url URL of the webpage with the email content
     * @param {((msg: string) => void) | null} log Function to log messages
     * @returns {Promise<zx.server.email.Message[]>} Array of messages to send
     */
    async run(url, log) {
      let messages = [];
      if (log === undefined) {
        log = console.log;
      }
      let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();

      let controller = new zx.server.puppeteer.PuppeteerController().set({
        username: config.authUser,
        password: config.authTokens["grasshopper.automatedLogin"] || null
      });

      controller.addListener("consoleLog", evt => {
        let data = evt.getData();
        log("Message from puppeteer: " + JSON.stringify(data)); //!!test
      });

      log("Initializing controller...");
      await controller.initialise(url);
      log("Initialised browser controller");

      let transport = controller.getTransport();
      let emailApi = new zx.server.puppeteer.api.EmailServerApi(transport);
      let headlessApi = new zx.server.puppeteer.api.HeadlessPageClientApi(transport);

      log("Received ready signal");
      await emailApi.subscribe("sendEmail", async data => {
        const {
          htmlBody,
          textBody,
          /**@type {EmailParameters}*/
          parameters
        } = data;
        parameters.to = parameters.to?.split(",") ?? [];
        parameters.cc = parameters.cc?.split(",") ?? [];
        parameters.bcc = parameters.bcc?.split(",") ?? [];
        log("Email body to send: " + htmlBody);
        log("Email parameters: " + JSON.stringify(parameters, null, 2));

        if (parameters.attachments) {
          const attachments = new qx.data.Array();
          for (let attachment of parameters.attachments) {
            if (attachment instanceof zx.server.email.Attachment) {
              attachments.push(attachment);
              continue;
            }
            attachments.push(
              new zx.server.email.Attachment().set({
                name: attachment.name,
                path: attachment.path
              })
            );
          }
          parameters.attachments = attachments;
        }

        // ensure all `undefined` values are replaced with `null`
        for (const key in parameters) {
          parameters[key] ??= null;
        }

        log("Composing email...");
        let message = await zx.server.email.Message.compose({ parameters, htmlBody, textBody });
        log("Email composed");
        messages.push(message);
        emailApi.next();
      });

      log("Started run");
      await headlessApi.run();
      log("Run Finished");
      return messages;
    }
  }
});
