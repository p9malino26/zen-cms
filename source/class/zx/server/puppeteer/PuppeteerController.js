/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

/**
 * @ignore (fetch)
 */
const PUPPETEER_VERSION = require("puppeteer-core/package.json")["version"];

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

  events: {
    /**
     * Fired when the Puppeteer client prints a message in the console
     */
    consoleLog: "qx.event.type.Data",
    ping: "qx.event.type.Event"
  },

  environment: {
    /** Whether to trigger a debugger statement to assist debugging a page */
    "zx.server.puppeteer.PuppeteerController.askDebugOnStartup": false
  },

  members: {
    /**
     * @type {zx.server.puppeteer.PuppeteerClientTransport}
     */
    __transport: null,

    /** @type{qx.Class<zx.io.api.client.AbstractClientApi>} the API class */
    __apiClass: null,

    /** @type{zx.io.api.client.AbstractClientApi} the API instance */
    __api: null,

    /** @type{zx.server.puppeteer.IChromium} the Chromium instance */
    __chromium: null,

    /** @type{zx.server.puppeteer.PuppeteerClient} the Puppeteer instance attached to the Chromium instance */
    __puppeteer: null,

    /** @type{Promise} the promise which will resolve when the API completes */
    __promiseFinished: null,

    /**
     * Visits a URL, creating an API instance to talk to the page
     *
     * @param {String} url
     * @oaram {zx.server.puppeteer.IChromium} chromium
     * @param {Object} [clientProperties] Properties to set to the Puppeteer client. Must be properties of zx.server.puppeteer.PuppeteerClient
     */
    async initialise(url, chromium, clientProperties = {}) {
      this.__chromium = chromium;
      console.log("ChromiumDocker aquired");

      $checkPuppeteerVersion: {
        let response = await fetch(`{this.__chromium.getBaseUrl()}/puppeteer-version`);
        let responseJson = await response.json();
        if (!responseJson) {
          throw new Error("Failed to get version from remote container. Please make sure you are using the latest docker image.");
        }
        let remoteVersion = responseJson.version;
        let remoteVersionSegments = remoteVersion.split(".").map(x => parseInt(x));
        if (remoteVersionSegments.some(x => isNaN(x)) || remoteVersionSegments.length !== 3) {
          throw new Error(`Invalid version number from remote container '${remoteVersion}'. Expected restricted SemVer format 'major.minor.patch'`);
        }

        let localVersion = PUPPETEER_VERSION;
        let localVersionSegments = localVersion.split(".").map(x => parseInt(x));
        if (localVersionSegments.some(x => isNaN(x)) || localVersionSegments.length !== 3) {
          throw new Error(`Invalid version number for local server '${localVersion}'. Expected restricted SemVer format 'major.minor.patch'`);
        }

        if (remoteVersionSegments[0] !== localVersionSegments[0]) {
          throw new Error(`Incompatible Puppeteer versions. Local server uses ${localVersion}, remote container uses ${remoteVersion}`);
        }
        if (remoteVersionSegments[1] !== localVersionSegments[1]) {
          console.warn(`WARNING: Puppeteer minor versions differ. Local server uses ${localVersion}, remote container uses ${remoteVersion}`);
        }
        if (remoteVersionSegments[2] !== localVersionSegments[2]) {
          console.info(`Puppeteer patch versions differ - did you forget to update? Local server uses ${localVersion}, remote container uses ${remoteVersion}`);
        }
      }

      let debugOnStartup = false;
      if (qx.core.Environment.get(this.classname + ".askDebugOnStartup")) {
        // you may want to set `debugOnStartup` to `true`
        debugger;
      }
      this.__puppeteer = new zx.server.puppeteer.PuppeteerClient().set({
        url,
        debugOnStartup,
        chromiumEndpoint: this.__chromium.getEndpoint(),
        username: this.getUsername(),
        password: this.getPassword(),
        ...clientProperties
      });
      this.__puppeteer.addListener("log", evt => {
        this.fireDataEvent("consoleLog", evt.getData());
        evt.preventDefault();
      });
      this.__puppeteer.addListener("ping", evt => this.fireEvent("ping"));

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

      let puppeteer = this.__puppeteer;
      let transport = new zx.server.puppeteer.PuppeteerClientTransport(puppeteer.getPage());

      puppeteer.addListenerOnce("close", () => transport.shutdown());

      let Clazz = this.__apiClass;
      this.__api = new Clazz(transport);

      let apiFinished = new qx.Promise();
      this.__promiseFinished = apiFinished.then(() => this.__closeDown());
      await puppeteer.waitForReadySignal();
      await this.__api.subscribe("complete", () => apiFinished.resolve());
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
     * @returns {zx.io.api.client.AbstractClientApi} the API instance
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
