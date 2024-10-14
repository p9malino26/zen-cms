const puppeteer = require("puppeteer");
const path = require("node:path");

/**
 * @asset(zx/server/puppeteer/dev/*)
 */
qx.Class.define("zx.server.puppeteer.WebServer", {
  extend: qx.core.Object,

  construct() {
    super();
    if (zx.server.puppeteer.WebServer.INSTANCE) {
      throw new Error("Too many instances of zx.server.puppeteer.WebServer");
    }
    zx.server.puppeteer.WebServer.INSTANCE = this;
  },

  properties: {
    listenPort: {
      init: 9000,
      check: "Integer"
    },

    chromePort: {
      init: null,
      nullable: true,
      check: "Integer"
    },

    logging: {
      init: null
    }
  },

  statics: {
    /** @type{zx.server.puppeteer.WebServer} singleton instance */
    INSTANCE: null
  },

  members: {
    /** @type{Fastify} the application */
    _app: null,

    __browser: null,

    /**
     * Starts the web server
     */
    async start() {
      try {
        const app = await this._createApplication();

        const chromePort = this.getChromePort() ?? this.getListenPort() + 1;
        if (chromePort < 1 || chromePort > 65535) throw new Error(`Invalid chromePort '${chromePort}'. Expected 1-65535`);

        const options = {
          headless: true,
          devtools: true,
          args: [
            `--remote-debugging-port=${chromePort}`,
            "--remote-debugging-address=0.0.0.0",
            "--no-sandbox",
            "--ignore-certificate-errors",
            "--disable-setuid-sandbox",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu"
          ]
        };

        this.__browser = await puppeteer.launch(options);
        console.log(`Chrome launched on port ${chromePort}`);

        const response = await zx.utils.Http.httpGet(`http://127.0.0.1:${chromePort}/json/version`);
        let jsonVersion = response.body;
        console.log("Chrome configuration:");
        console.log(JSON.stringify(jsonVersion, null, 2));

        if (qx.core.Environment.get("qx.debug")) {
          app.register(require("@fastify/static"), {
            root: path.dirname(qx.util.ResourceManager.getInstance().toUri("zx/server/puppeteer/dev/MARKER")),
            prefix: "/dev/",
            redirect: true
          });
        }

        app.get("/json/version", (req, rep) => rep.status(404).send("Not found"));
        app.get("/json/list", (req, rep) => rep.status(404).send("Not found"));
        app.get("*", (req, rep) => console.log("GET", req.url, "- UNKNOWN"));

        await app.listen({ port: this.getListenPort(), host: "0.0.0.0" });
        console.log(`Webserver started on http://127.0.0.1:${this.getListenPort()}`);
      } catch (cause) {
        // TODO: something causes the thrown error to print a minimal and unhelpful representation of the error
        console.error(cause);
        process.exit(1);
      }
    },

    /**
     * Stops the web server
     */
    async stop() {
      if (this.__browser) {
        let browser = this.__browser;
        this.__browser = null;
        await browser.close();
      }
      await this._app.close();
      process.exit(0);
    },

    /**
     * Creates the Fastify application
     */
    async _createApplication() {
      let options = {
        logger: false
      };

      if (this.getLogging()) {
        options.logger = qx.lang.Object.mergeWith(
          {
            transport: {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname"
              }
            }
          },

          this.getLogging()
        );
      }

      const app = (this._app = require("fastify")(options));
      app.register(require("@fastify/multipart"), {
        limits: {
          fieldNameSize: 100, // Max field name size in bytes
          fieldSize: 512, // Max field value size in bytes
          fields: 10, // Max number of non-file fields
          fileSize: 1 * 1024 * 1024, // For multipart forms, the max file size in bytes
          files: 10, // Max number of file fields
          headerPairs: 2000 // Max number of header key=>value pairs
        }
      });

      app.decorateReply("json", function (payload) {
        this.code(200).header("Content-Type", "application/json; charset=utf-8").send(JSON.stringify(payload, null, 2));
        return this;
      });
      app.decorateReply("text", function (payload) {
        this.code(200).type("plain/text").send(payload);
        return this;
      });
      app.decorateReply("notFound", function (message) {
        this.code(404)
          .type("plain/text")
          .send(message || "Not found");
        return this;
      });
      app.decorateReply("serverError", function (message) {
        this.code(500)
          .type("plain/text")
          .send(message || "Internal Error");
        return this;
      });

      const send = require("@fastify/send");
      app.decorateReply("sendFileAbsolute", function (filename) {
        send(this.request.raw, filename).pipe(this.raw);
        return this;
      });

      // REST API
      const RAS = zx.server.rest.RestApiServer;
      app.route({
        method: ["GET", "POST"],
        url: RAS.getEndpoint(),
        handler: this.wrapMiddleware(RAS.middleware)
      });

      RAS.registerApi("puppeteer", new zx.server.puppeteer.PuppeteerApi());

      let chromePort = this.getChromePort();
      if (chromePort === null || chromePort < 1) {
        chromePort = this.getListenPort() + 1;
      }

      app.get("/test", {}, (request, reply) => {
        reply.send({ hello: "world" });
      });

      return app;
    },

    /**
     * Wraps a middleware function so that it can run in a request context and
     * exeptions are handled gracefully
     *
     * @param {Function} fn
     * @returns {Function} the wrapped function
     */
    wrapMiddleware(fn) {
      return async (req, reply) => {
        try {
          let result = await fn(req, reply);
          await reply;
        } catch (ex) {
          if (ex instanceof zx.utils.Http.HttpError) {
            if (ex.statusCode < 400 || ex.statusCode >= 500) {
              this.error(`Exception raised:\n${ex}`);
            }
            await this.sendErrorPage(req, reply, ex.statusCode, ex.message);
          } else {
            this.error(`Exception raised:\n${ex}`);
            await this.sendErrorPage(req, reply, 500, ex.message);
          }
        }
        return reply;
      };
    }
  }
});
