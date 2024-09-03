qx.Class.define("zx.server.puppeteer.PuppeteerController", {
  extend: qx.core.Object,

  construct(apiClass) {
    super();
    this.__apiClass = apiClass;
  },

  properties: {
    /** Username to logon with */
    username: {
      init: null,
      nullable: true,
      check: "String"
    },

    /** Password to logon with */
    password: {
      init: null,
      nullable: true,
      check: "String"
    }
  },

  members: {
    /** @type{qx.Class<zx.server.puppeteer.AbstractServerApi>} the API class */
    __apiClass: null,

    /** @type{zx.server.puppeteer.AbstractServerApi} the API instance */
    __api: null,

    /** @type{zx.server.puppeteer.chromiumdocker.ChromiumDocker} the Chromium instance */
    __chromium: null,

    /** @type{zx.server.puppeteer.PuppeteerClient} the Puppeteer instance attached to the Chromium instance */
    __puppeteer: null,

    /** @type{Promise} the promise which will resolve when the API completes */
    __promiseFinished: null,

    /**
     * Visits a URL, creating an API instance to talk to the page
     *
     * @param {String} url
     * @param {Object?} clientProperties Properties to set to the Puppeteer client. Must be properties of zx.server.puppeteer.PuppeteerClient
     */
    async initialise(url, clientProperties) {
      this.__chromium = await zx.server.puppeteer.chromiumdocker.ChromiumDocker.acquire();
      console.log("ChromiumDocker aquired");

      clientProperties ??= {};

      this.__puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
        url,
        chromiumEndpoint: this.__chromium.getEndpoint(),
        username: this.getUsername(),
        password: this.getPassword(),
        ...clientProperties
      });

      this.debug("Puppeteer client created");

      try {
        // This can throw an exception if the URL is refused or other reasons
        await this.__puppeteer.start();
        this.debug("Puppeteer client started");
      } catch (ex) {
        try {
          this.__closeDown();
        } catch (ex2) {
          this.error("Exception in closeDown after exception: " + (ex2.stack || ex2));
        }
        throw ex;
      }

      this.__api = this.__puppeteer.createRemoteApi(this.__apiClass);
      let apiFinished = new qx.Promise();
      this.__promiseFinished = apiFinished.then(async () => await this.__closeDown());

      this.__api.addListener("complete", evt => apiFinished.resolve());
    },

    async start() {
      await this.__api.start();
      console.log("Email API started");
    },

    /**
     * Closes down the Puppeteer and Chromium instances
     */
    async __closeDown() {
      this.__api = null;

      await this.__puppeteer.stop();
      this.__puppeteer.dispose();
      this.__puppeteer = null;
      console.log("Puppeteer client stopped");

      await this.__chromium.release();
      this.__chromium = null;
      console.log("Chromium released");
    },

    /**
     * The API instance
     *
     * @returns {zx.server.puppeteer.AbstractServerApi} the API instance
     */
    getApi() {
      return this.__api;
    },

    /**
     * The Puppeteer instance
     *
     * @returns {zx.server.puppeteer.PuppeteerClient} the Puppeteer instance
     */
    getPuppeteer() {
      return this.__puppeteer;
    },

    /**
     * The promise which will resolve when the API completes
     *
     * @returns {Promise} the promise which will resolve when the API completes
     */
    promiseFinished() {
      return this.__promiseFinished;
    }
  }
});
