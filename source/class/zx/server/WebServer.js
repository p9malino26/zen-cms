/* ************************************************************************
 *
 *  Zen [and the art of] CMS
 *
 *  https://zenesis.com
 *
 *  Copyright:
 *    2019-2022 Zenesis Ltd, https://www.zenesis.com
 *
 *  License:
 *    MIT (see LICENSE in project root)
 *
 *  Authors:
 *    John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * ************************************************************************ */

const fs = require("fs");
const path = require("path");
const { AsyncLocalStorage } = require("async_hooks");

/**
 * The Web Server
 *
 * @use(zx.cms.app.auth.LoginFormFeature)
 * @use(zx.cms.app.auth.LogoutFeature)
 */
qx.Class.define("zx.server.WebServer", {
  extend: zx.server.Standalone,

  properties: {
    /** Port to listen on */
    listenPort: {
      init: 8080,
      nullable: false,
      check: "Integer"
    }
  },

  members: {
    /** {Fastify} the application */
    _app: null,

    /** {zx.io.remote.NetworkController} controller for IO with the browsers */
    _networkController: null,

    /**
     * @typedef {Object} AlsRequestContext
     * @property {Fastify.Request} request
     * @property {Fastify.Reply} reply
     *
     * @type{AsyncLocalStorage<AlsRequestContext>} used for the current request/reply */
    __alsRequest: null,

    /**
     * Called to start the server
     */
    async start() {
      await this.base(arguments);
      if (this._config.createProxies) {
        let proxiesOutputPath = this._config.createProxies?.outputPath;
        if (proxiesOutputPath) {
          let compilerTargetPath = this._config.createProxies?.compilerTargetPath;
          if (!compilerTargetPath) throw new Error("Missing compilerTargetPath in cms.json/createProxies");
          let ctlr = new zx.io.remote.proxy.ClassesWriter().set({
            outputPath: proxiesOutputPath,
            compilerTargetPath: compilerTargetPath
          });
          await ctlr.writeAllProxiedClasses();
        }
      }
      await this._startServer();
      await this._registerUrls();
    },

    /**
     * Creates and starts the web server
     */
    async _startServer() {
      let app = await this._createApplication();

      try {
        await app.listen(this.getListenPort(), "0.0.0.0");
      } catch (err) {
        console.error("Error when starting the server: " + err);
        process.exit(1);
      }

      console.log(`Webserver started on http://localhost:${this.getListenPort()}`);
    },

    /**
     * Called to register URLs for the network IO
     *
     * @returns {zx.server.Configuration} the master configuration for the user
     */
    async _registerUrls() {
      let config = this._createCmsConfiguration();
      await config.initialise();
      this._networkController.putUriMapping("zx.server.CmsConfiguration", config);
      this._networkController.putUriMapping("zx.server.auth.LoginApi", new zx.server.auth.LoginApi());

      config.registerApi("zx.server.auth.LoginApi", zx.server.auth.LoginApi);
      config.registerApi("zx.server.auth.LoginApiAdmin", zx.server.auth.LoginApiAdmin, "zx-super-user");
      return config;
    },

    /**
     * Creates an instance of zx.server.CmsConfiguration
     *
     * @returns {zx.server.CmsConfiguration}
     */
    _createCmsConfiguration() {
      return new zx.server.CmsConfiguration();
    },

    /**
     * Creates the Fastify application
     *
     * @return {Fastify}
     */
    async _createApplication() {
      if (this._app) return this._app;
      const app = (this._app = require("fastify")({ logger: false }));
      app.register(require("fastify-cookie"));
      app.register(require("fastify-prettier"));
      app.register(require("fastify-multipart"), {
        limits: {
          fieldNameSize: 100, // Max field name size in bytes
          fieldSize: 512, // Max field value size in bytes
          fields: 10, // Max number of non-file fields
          fileSize: 10 * 1024 * 1024, // For multipart forms, the max file size in bytes
          files: 2, // Max number of file fields
          headerPairs: 2000 // Max number of header key=>value pairs
        }
      });
      await this._initSessions(app);
      await this._initApplication(app);
      await this._initApis();
      await this._initUrlRules();
      return app;
    },

    /**
     * Initialises the sessions middleware
     *
     * @param app {Fastify}
     */
    async _initSessions(app) {
      let sessionConfig = this._config.session || {};
      if (!sessionConfig.secret)
        this.warn("Using default secret for signing sessions - please set session.secret in the configuration");
      if (sessionConfig.secret.length < 32) {
        this.warn("session.secret in the configuration is too short, it should be at least 32 characters");
        sessionConfig.secret = null;
      }

      let databaseConfig = this._config.database.mongo;
      let manager = new zx.server.SessionManager(databaseConfig.uri, databaseConfig.databaseName, "sessions");
      manager.set({
        secret: sessionConfig.secret || "yHbUWDFyEKikhuXgqzkgjxj7gBwZ6Ahm",
        cookieName: "zx.cms.sessionId",
        cookieOptions: {
          maxAge: 5 * 24 * 60 * 60 * 1000,
          sameSite: "strict",
          // This needs to be false unless on HTTPS (otherwise cookies will not be sent by @fastify/session)
          secure: false //sessionConfig.secureCookie === false ? false : true
        }
      });

      await manager.open();
      manager.registerWithFastify(app);
    },

    /**
     * Initialises the Fastify
     *
     * @param app {Fastify}
     */
    async _initApplication(app) {
      app.register(require("fastify-formbody"));

      this.__alsRequest = new AsyncLocalStorage();

      const wrapMiddleware = fn => {
        return async (req, reply) => {
          try {
            return await this.runInRequestContext({ request: req, reply: reply }, () => fn(req, reply));
          } catch (ex) {
            if (ex instanceof zx.server.WebServer.HttpError) {
              if (ex.statusCode < 400 || ex.statusCode >= 500) this.error(`Exception raised:\n${ex}`);
              await this.sendErrorPage(req, reply, ex.statusCode, ex.message);
            } else {
              this.error(`Exception raised:\n${ex}`);
              await this.sendErrorPage(req, reply, 500, ex.message);
            }
          }
        };
      };

      app.addHook("onRequest", async (request, reply) => {
        try {
          await this._onRequestHook(request, reply);
        } catch (ex) {
          this.error("Exception during _onRequestHook: " + ex);
          throw ex;
        }
      });

      // Map to Qooxdoo compiled resources
      let fastifyStatic = require("fastify-static");
      let targets = this._config.targets || {};
      app.register(fastifyStatic, {
        root: path.resolve("compiled", targets.browser || "source"),
        prefix: "/zx/code"
      });
      app.register(fastifyStatic, {
        root: path.resolve("node_modules/medium-editor/dist"),
        prefix: "/zx/extra/medium-editor",
        decorateReply: false
      });

      app.get(
        "/zx/impersonate/:shortCode",
        wrapMiddleware(async (req, reply) => await this.__impersonate(req, reply))
      );
      app.get(
        "/zx/shorturl/:shortCode",
        wrapMiddleware(async (req, reply) => await this.__shortUrl(req, reply))
      );

      app.get(
        "/zx/theme/*",
        wrapMiddleware(async (req, reply) => await this._renderer.getTheme().middleware(req, reply))
      );

      // REST API
      const ARAS = zx.thin.api.AbstractRestApiServer;
      app.route({
        method: ["GET", "POST"],
        url: ARAS.getEndpoint(),
        handler: wrapMiddleware(ARAS.middleware)
      });

      // zx.io.remote
      this._networkController = new zx.io.remote.NetworkController();
      let xhrListener = new zx.io.remote.FastifyXhrListener(this._networkController);
      app.route({
        method: ["GET", "POST"],
        url: "/zx/io/xhr",
        handler: wrapMiddleware(async (req, reply) => await xhrListener.middleware(req, reply))
      });

      await this._initExtraPaths(app, wrapMiddleware);

      app.get(
        "*",
        wrapMiddleware(async (req, reply) => await this._defaultUrlHandler(req, reply))
      );
    },

    /**
     * Called to allow implementations to add extra paths, just before the default catch all is installed
     *
     * @param {Fastify} app
     * @param {Function} wrapMiddleware function can be optionally used to handle exceptions
     */
    async _initExtraPaths(app, wrapMiddleware) {
      // Nothing
    },

    /**
     * Called to initialise the url rule handling
     */
    _initUrlRules() {
      let site = this.getSite();
      this.__urlRules = [];
      site.getUrlRules().forEach(rule => {
        let data = {
          match: null,
          type: "exact",
          rule: rule
        };
        if (!rule.getIsRegEx()) {
          data.match = rule.getUrl().toLowerCase();
        } else {
          data.match = new RegExp(rule.getUrl());
          data.type = "regex";
        }
        data.rule = rule;
        this.__urlRules.push(data);
      });
    },

    /**
     * Fastify hook to check for appropriate URL rules
     *
     * @param {Fastify.Request} request
     * @param {Fastify.Reply} reply
     */
    async _onRequestHook(request, reply) {
      let url = request.url.toLowerCase();
      let pos = url.indexOf("?");
      let query = "";
      if (pos > -1) {
        query = url.substring(pos);
        url = url.substring(0, pos);
      }
      if (url.length == 0) url = "/index.html";
      else if (url[url.length - 1] == "/") url += "index.html";

      const takeActionImpl = async (action, redirectTo, customActionCode) => {
        if (action === null) return;

        switch (action) {
          case "blockNotFound":
            reply.code(404);
            return;

          case "redirectTemporary":
            reply.redirect(redirectTo, 302);
            return;

          case "redirectPermanent":
            reply.redirect(redirectTo, 301);
            return;

          case "redirectInternally":
            await this._defaultUrlHandler(request, reply, redirectTo + query);
            return;

          case "custom":
            await this._handleCustomAction(customActionCode);
        }
      };

      let matches = [];
      for (let i = 0; i < this.__urlRules.length; i++) {
        let data = this.__urlRules[i];
        let rule = data.rule;
        if (data.type == "exact") {
          if (url != data.match) continue;
        } else {
          if (!data.match.test(url)) continue;
        }

        // A denied rule is a hard stop
        if (await rule.isDenied(request)) {
          await takeActionImpl(rule.getDeniedAction(), rule.getDeniedRedirectTo(), rule.getDeniedCustomActionCode());
          return;
        }

        // A granted rule, may or may not have an action;
        if (await rule.isGranted(request)) {
          let action = rule.getGrantedAction();
          if (action && action != "allow") {
            await takeActionImpl(action, rule.getGrantedRedirectTo(), rule.getGrantedCustomActionCode());
            return;

            // An "allow" action short circuits the rest of the checks
          } else if (action == "allow") {
            break;
          }
        }

        matches.push(rule);
      }

      let cachability = null;
      let cacheRevalidation = null;
      let maxAge = null;
      matches.forEach(rule => {
        if (cachability === null) {
          let tmp = rule.getCachability();
          if (tmp !== null) cachability = tmp;
        }

        if (cacheRevalidation === null) {
          let tmp = rule.getCacheRevalidation();
          if (tmp !== null) cacheRevalidation = tmp;
        }

        if (maxAge === null) {
          let tmp = rule.getMaxAge();
          if (tmp !== null) maxAge = tmp;
        }
      });

      let directives = [];
      if (cachability !== null) directives.push(cachability);
      if (cacheRevalidation !== null) directives.push(cacheRevalidation);
      if (maxAge !== null && maxAge >= 0) directives.push("max-age=" + maxAge);

      if (directives.length) {
        reply.header("Cache-Control", directives.join(", "));
      }
    },

    async __impersonate(request, reply) {
      let shortUrl = await zx.cms.system.ShortUrl.getShortUrlByShortCode(request.params.shortCode);
      if (!shortUrl || shortUrl.getType() != "impersonate") {
        this.sendErrorPage(request, reply, 404);
        return;
      }
      await shortUrl.deleteFromDatabase();

      let data = JSON.parse(shortUrl.getValue());
      let oldest = zx.utils.Dates.addMinutes(new Date(), -15);
      if (!data || data.timeNow < oldest.getTime()) {
        this.sendErrorPage(request, reply, 404, "Expired");
        return;
      }

      let currentUser = await zx.server.auth.User.getUserFromSession(request);
      if (currentUser && currentUser.getUsername().toLowerCase() != data.username.toLowerCase()) {
        await new qx.Promise(resolve => request.destroySession(resolve));
        await new qx.Promise(resolve => request.createNewSession(resolve));
        currentUser = null;
      }

      if (!currentUser) {
        let user = await zx.server.auth.User.getUserFromEmail(data.username);
        if (user != null) user.login(request, false);
      }
      reply.redirect(data.redirectTo || "/");
    },

    __shortUrl(request, reply) {},

    /**
     * Called to handle a custom action for a url rule
     *
     * @param {Fastify.Request} req
     * @param {Fastify.Reply} reply
     * @param {String} customCode
     */
    async _handleCustomAction(req, reply, customCode) {
      this.error(`No action to perform for customCode ${customCode} for ${req.url}`);
      this.sendErrorPage(req, reply, 404);
    },

    /**
     * Attempts to get a hash from a url and appends it to the url as a query string; this
     * is used in the html layouts so that URLs to files which are generated can include
     * something to make them unique and cache-busting.  This approach allows long cache
     * expiry headers to be used (with immutable, where supported) but also guarantees that
     * changes are seen by the browser.
     *
     * @param {String} url
     * @returns {String} the modified url, or the same url if there is no change to be had
     */
    getUrlFileHash(url) {
      function addHash(filename) {
        let stat = fs.statSync(filename, { throwIfNoEntry: false });
        if (!stat) return url;
        let pos = url.indexOf("?");
        if (pos > -1) url += "&";
        else url += "?";
        url += stat.mtimeMs;
        return url;
      }

      if (url.startsWith("/zx/code/")) {
        let targets = this._config.targets || {};
        let tmp = url.substring(9);
        tmp = path.join(path.resolve("compiled", targets.browser || "source"), tmp);
        return addHash(tmp);
      } else if (url.startsWith("/zx/theme/")) {
        let tmp = url.substring(10);
        tmp = this._renderer.getTheme().resolveSync(tmp);
        if (tmp) return addHash(tmp);
      }

      return url;
    },

    /**
     * Returns the controller for remote I/O with the clients
     *
     * @returns {zx.io.persistence.NetworkController}
     */
    getNetworkController() {
      return this._networkController;
    },

    /**
     * Returns the request context, an object that contains `request` and `reply`
     *
     * @returns {AlsRequestContext}
     */
    getRequestContext() {
      let store = this.__alsRequest.getStore();
      if (!store) throw new Error("Cannot get request context outside of the request");
      return store;
    },

    /**
     * Runs the function with a given request context
     *
     * @param {AlsRequestContext} context
     * @param {Function} fn
     * @return {*}
     */
    async runInRequestContext(context, fn) {
      return await this.__alsRequest.run(context, fn);
    },

    /**
     * Called to initialise APIs
     */
    async _initApis() {},

    /**
     * The handler for urls
     */
    async _defaultUrlHandler(req, reply, url) {
      if (!url) url = req.url;

      let pos = url.indexOf("?");
      if (pos > -1) url = url.substring(0, pos);

      // Normalise the path
      if (url[url.length - 1] == "/") url += "index.html";

      // Get the page
      if (url.endsWith(".html")) {
        let dbUrl = (url = "pages" + url.substring(0, url.length - 5));
        let object = await this.getObjectByUrl(dbUrl);
        if (!object) throw new zx.server.WebServer.HttpError(404, `Cannot find ${url}`);

        if (!qx.Class.hasInterface(object.constructor, zx.cms.render.IViewable))
          throw new zx.server.WebServer.HttpError(
            500,
            `Cannot render object for ${url} because it is not viewable, it is ${object.classname}: ${object}`
          );

        let rendering = new zx.cms.render.FastifyRendering(req, reply);
        await this._renderer.renderViewable(rendering, object);
        return;
      }

      // Oops
      throw new zx.server.WebServer.HttpError(404, `Cannot find ${url}`);
    },

    /**
     * Sends an error page
     */
    async sendErrorPage(req, reply, statusCode, message) {
      if (statusCode == 200) throw new Error("Invalid status code 200!");
      let rendering = new zx.cms.render.FastifyRendering(req, reply);
      await this._renderer.renderSystemPage(rendering, statusCode, {
        statusCode,
        message
      });
    }
  },

  statics: {
    HttpError: null,

    /**
     * Returns the request currently being processed.  This will throw an
     * exception if called outside of a request
     *
     * @returns {fastify.Request}
     */
    getCurrentRequest() {
      return zx.server.Standalone.getInstance().getRequestContext().request;
    },

    /**
     * Returns the reponse currently being processed.  This will throw an
     * exception if called outside of a request
     *
     * @returns {fastify.Response}
     */
    getCurrentReponse() {
      return zx.server.Standalone.getInstance().getRequestContext().response;
    }
  },

  defer(statics) {
    class HttpError extends Error {
      constructor(statusCode, message) {
        super(message);
        if (typeof statusCode == "string") {
          let tmp = parseInt(statusCode, 10);
          if (isNaN(tmp)) {
            message = statusCode;
            statusCode = 500;
          } else {
            statusCode = tmp;
          }
        }
        this.statusCode = statusCode || 500;
      }
    }

    statics.HttpError = HttpError;
  }
});
