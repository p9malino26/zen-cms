/**
 * Abstract class for all the puppeteer server APIs which run in the browser
 */
qx.Class.define("zx.thin.puppeteer.api.AbstractBrowserApi", {
  extend: zx.io.api.server.AbstractServerApi,
  type: "abstract",

  /**
   * Constructor, attaches to the given HeadlessPage
   * @param {string} apiName Name (ID) of the API
   */
  construct(apiName) {
    super(apiName);
    zx.io.api.server.ConnectionManager.getInstance().registerApi(this);

    // For backwards compatibility
    this.__headless = {
      postReady() {
        zx.thin.puppeteer.PuppeteerServerTransport.getInstance().makeReady();
      }
    };
  },

  members: {
    /**@override */
    _publications: {
      /**
       * Fired when we are done with the browser and can shut it down
       */
      complete: null
    },

    /**
     * Call this when we are done with the browser and can shut it down
     */
    complete() {
      this.publish("complete");
    },

    postReady() {
      zx.thin.puppeteer.PuppeteerServerTransport.getInstance().makeReady();
    },

    /**
     * @deprecated
     * For backwards compatibility
     * Returns dummy headlesss with postready method
     */
    getHeadless() {
      return this.__headless;
    }
  }
});
