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
    async run(worker, url) {
      let messages = [];
      let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();

      let ctlr = new zx.server.puppeteer.PuppeteerWorkController(worker, url, [zx.server.puppeteer.api.IPageApi], {
        username: config.authUser,
        password: config.authTokens["grasshopper.automatedLogin"] || null
      });

      ctlr.addListener("consoleLog", evt => {
        let data = evt.getData();
        worker.appendWorkLog("Message from puppeteer: " + JSON.stringify(data));
      });

      worker.appendWorkLog("Initializing controller...");
      await ctlr.open();
      worker.appendWorkLog("Initialised browser controller");

      worker.appendWorkLog("Received ready signal");
      let pageApi = ctlr.getClientApi(zx.server.puppeteer.api.IPageApi);
      await pageApi.subscribe("pageReady", async data => {
        let {
          htmlBody,
          textBody,
          /**@type {EmailParameters}*/
          parameters
        } = data;
        parameters.to = parameters.to?.split(",") ?? [];
        parameters.cc = parameters.cc?.split(",") ?? [];
        parameters.bcc = parameters.bcc?.split(",") ?? [];
        worker.appendWorkLog("Email body to send: " + htmlBody);
        worker.appendWorkLog("Email parameters: " + JSON.stringify(parameters, null, 2));

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

        worker.appendWorkLog("Composing email...");
        let message = await zx.server.email.Message.set({ ...parameters, htmlBody, textBody });
        await message.save();
        worker.appendWorkLog("Email composed");
        messages.push(message);
        pageApi.next();
      });

      let promiseComplete = pageApi.whenNextSubscriptionFired("complete");
      await pageApi.start();
      await promiseComplete;
      await ctlr.close();
      ctlr.dispose();

      worker.appendWorkLog("Finished browser controller");
      return messages;
    },

    async createGenericEmail(worker, subject, message, to) {
      let params = {
        title: subject,
        message,
        to,
        subject
      };
      let config = grasshopper.services.ServicesConfig.getInstance().getConfigData();
      let url = `${config.baseUrl}/generic-email.html?`;
      // prettier-ignore
      url += Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

      await zx.server.email.EmailRenderer.run(worker, url);
    }
  }
});
