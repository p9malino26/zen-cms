qx.Class.define("zx.thin.puppeteer.api.AbstractBrowserApi", {
  extend: qx.core.Object,
  type: "abstract",

  /**
   * Constructor, attaches to the given HeadlessPage
   *
   * @param {String} serverApiName the server API namespace (typically the name of the class derived from `zx.server.puppeteer.AbstractServerApi` on the server)
   * @param {zx.thin.puppeteer.HeadlessPage?} headless defaults to the singleton instance
   */
  construct(serverApiName, headless) {
    super();
    this.__serverApiName = serverApiName;
    this.__headless = headless || zx.thin.puppeteer.HeadlessPage.getInstance();
    this.__headless.addBrowserApi(this);
  },

  members: {
    /** @type{String} the server API namespace (typically the name of the class derived from `zx.server.puppeteer.AbstractServerApi` on the server) */
    __serverApiName: null,

    /** @type{zx.thin.puppeteer.HeadlessPage} */
    __headless: null,

    /**
     * Called when there are no more emails to send
     */
    complete() {
      this.apiSendEvent("complete");
    },

    /**
     * Sends an API event to the server
     *
     * @param {String} eventName
     * @param {*} data
     */
    apiSendEvent(eventName, data) {
      this.__headless.apiSendEvent(this.__serverApiName, eventName, data);
    },

    /**
     * The server API namespace (typically the name of the class derived from `zx.server.puppeteer.AbstractServerApi`  on the server)
     *
     * @returns {String} the server API namespace
     */
    getServerApiName() {
      return this.__serverApiName;
    },

    /**
     * The instance of `zx.thin.puppeteer.HeadlessPage` that this API is attached to
     *
     * @returns {zx.thin.puppeteer.HeadlessPage} the HeadlessPage controller
     */
    getHeadless() {
      return this.__headless;
    }
  }
});
