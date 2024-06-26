qx.Class.define("zx.server.puppeteer.api.EmailServerApi", {
  extend: zx.server.puppeteer.AbstractServerApi,

  construct(puppeteer) {
    super(puppeteer, ["start", "next"]);
  },

  events: {
    sendEmail: "qx.event.type.Data",
    complete: "qx.event.type.Data"
  }
});
