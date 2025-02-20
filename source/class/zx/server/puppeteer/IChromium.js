/**
 * Interface for accessing a Chromium instance
 */
qx.Interface.define("zx.server.puppeteer.IChromium", {
  members: {
    /**
     * Returns the base URL for accessing Chromium - this is the HTTP url, and
     * when appended by `/version` will provide JSON about the Chromium instance
     *
     * @return {String}
     */
    getBaseUrl() {},

    /**
     * Returns the websocket endpoint for accessing Chromium
     *
     * @return {String}
     */
    getEndpoint() {},

    /**
     * Called when this instance is no longer needed (Chromium is expected to be
     * pooled, and this returns the instance to the pool)
     */
    release() {}
  }
});
