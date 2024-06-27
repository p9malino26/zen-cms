/**
 * Used to render HTML emails in the browser and then send them
 */
qx.Class.define("zx.server.email.EmailRenderer", {
  statics: {
    /**
     * @param {string} url URL of the webpage with the email content
     * @param {(msg: string) => void | null} log Function to log messages
     * @returns {Promise<zx.server.email.Message[]>} Array of messages to send
     */
    async run(url, log) {
      let messages = [];
      if (log === undefined) {
        log = console.log;
      }
      try {
        let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();

        let controller = new zx.server.puppeteer.PuppeteerController(zx.server.puppeteer.api.EmailServerApi).set({
          username: config.authUser,
          password: config.authTokens["grasshopper.automatedLogin"] || null
        });

        await controller.initialise(url);
        log("Initialised browser controller");

        let puppeteer = controller.getPuppeteer();
        await puppeteer.waitForReadySignal();
        log("Received ready signal");

        let api = controller.getApi();
        api.addListener("sendEmail", async evt => {
          const {
            htmlBody,
            textBody,
            /**@type {EmailParameters}*/
            parameters
          } = evt.getData();
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

          let message = await zx.server.email.Message.compose({ parameters, htmlBody, textBody });
          messages.push(message);
          api.next();
        });

        await api.start();
        log("Started API");
        await controller.promiseFinished();
        log("Finished browser controller");
      } catch (ex) {
        console.error("Exception in client: " + (ex.stack || ex));
      }
      return messages;
    }
  }
});
