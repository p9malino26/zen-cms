qx.Class.define("zx.server.puppeteer.PuppeteerWorkController", {
  extend: qx.core.Object,

  construct(worker, url, apiClassnames, clientProperties) {
    super();
    this.__clientApis = {};
    this.__url = url;
    this.__clientProperties = clientProperties;
    for (let apiClassname of apiClassnames) {
      this.__clientApis[apiClassname] = null;
    }
    this.__worker = worker;
  },

  members: {
    /** @type{zx.server.work.IWorker} the worker we're operating for */
    __worker: null,

    /** @type{zx.server.puppeteer.PuppeteerClientTransport} the client transport for talking to APIs in Chromium */
    __transport: null,

    /** @type{Object<String, zx.io.api.client.AbstractClientApi} Client APIs */
    __clientApis: null,

    /** @type{zx.server.puppeteer.PuppeteerClient} the PuppeteerClient for the page we are controlling */
    __puppeteerClient: null,

    /**
     * Finds a Client API by name
     *
     * @param {String} apiClassname
     * @returns {zx.io.api.client.AbstractClientApi}
     */
    getClientApi(apiClassname) {
      return this.__clientApis[apiClassname];
    },

    /**
     * The Puppeteer Client
     *
     * @returns {zx.server.puppeteer.PuppeteerClient}
     */
    getPuppeteerClient() {
      return this.__puppeteerClient;
    },

    /**
     * Initialises and connects to Chromium
     */
    async open() {
      let json = this.__worker.getWorkJson();
      if (!this.__url) {
        throw new Error("No URL specified");
      }
      this.debug(`Executing for url ${this.__url}: ` + JSON.stringify(json, null, 2));

      let chromium = await this.__worker.getChromium();

      let debugOnStartup = !!json.debugOnStartup;
      if (qx.core.Environment.get(this.classname + ".askDebugOnStartup")) {
        // you may want to set `debugOnStartup` to `true`
        debugger;
      }

      let clientProperties = json.clientProperties || {};
      if (this.__clientProperties) {
        clientProperties = { ...clientProperties, ...this.__clientProperties };
      }

      let puppeteerClient = new zx.server.puppeteer.PuppeteerClient().set({
        url: this.__url,
        debugOnStartup: debugOnStartup,
        chromiumEndpoint: chromium.getEndpoint(),
        ...clientProperties
      });
      puppeteerClient.addListener("log", evt => {
        this.__worker.appendWorkLog(evt.getData());
        evt.preventDefault();
      });
      puppeteerClient.addListener("ping", evt => this.debug("ping"));

      this.debug("Puppeteer client created");
      this.__puppeteerClient = puppeteerClient;

      try {
        // This can throw an exception if the URL is refused or other reasons
        await puppeteerClient.start();
        this.debug("Puppeteer client started");
      } catch (ex) {
        try {
          await puppeteerClient.stop();
          puppeteerClient.dispose();
        } catch (ex2) {
          this.error("Exception in closeDown after exception: " + (ex2.stack || ex2));
        }
        throw ex;
      }

      if (Object.keys(this.__clientApis).length) {
        this.__transport = new zx.server.puppeteer.PuppeteerClientTransport(puppeteerClient.getPage());
        for (let apiName in this.__clientApis) {
          let api = zx.io.api.ApiUtils.createClientApi(apiName, this.__transport);
          this.__clientApis[apiName] = api;
        }
      }

      puppeteerClient.addListenerOnce("close", () => this.close());
    },

    /**
     * Closes the connection to Chromium/Puppeteer
     */
    async close() {
      if (this.__transport) {
        this.__transport.shutdown();
        this.__transport = null;
      }
      if (this.__puppeteerClient) {
        await this.__puppeteerClient.stop();
        this.__puppeteerClient.dispose();
        this.__puppeteerClient = null;
      }
      this.debug("Puppeteer client closed");
    }
  }
});
