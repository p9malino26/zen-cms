qx.Class.define("zx.server.puppeteer.api.PngServerApi", {
  extend: zx.server.puppeteer.AbstractServerApi,

  construct(puppeteer) {
    super(puppeteer, ["start", "next"]);
  },

  events: {
    takeScreenshot: "qx.event.type.Data",
    complete: "qx.event.type.Data"
  }
});
