qx.Class.define("zx.server.puppeteer.TakeScreenshotWork", {
  implement: zx.server.work.IWork,
  extend: qx.core.Object,

  members: {
    /**
     * @override
     */
    async execute(worker) {
      let json = worker.getWorkJson();
      if (!json.filename) {
        throw new Error("No filename specified");
      }

      let ctlr = new zx.server.puppeteer.PuppeteerWorkController(worker, [zx.server.puppeteer.api.IPageApi]);
      await ctlr.open();
      let pageApi = ctlr.getClientApi(zx.server.puppeteer.api.IPageApi);
      await pageApi.start();

      let filename = worker.resolveFile(json.filename);
      this.debug("Saving PNG to " + filename);
      await ctlr.getPuppeteer().takeScreenshot(filename);
      this.debug("PNG saved");

      await ctlr.close();
      ctlr.dispose();
      this.debug("Puppeteer client stopped");

      return "success!";
    }
  }
});
