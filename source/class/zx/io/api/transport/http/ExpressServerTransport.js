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
 *    Will Johnson (@willsterjohnson)
 *
 * ************************************************************************ */

const bodyParser = require("body-parser");

/**
 *
 */
qx.Class.define("zx.io.api.transport.http.ExpressServerTransport", {
  extend: zx.io.api.server.AbstractServerTransport,

  /**
   * Note: it is expected that the incoming app will use the `zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware`
   * middleware. The result of this middleware is largely the same as `bodyParser.json()`, however it additionally
   * supports communicating certain classes, such as `Date`s, through JSON. See {@link zx.utils.Json} for details on
   * the additional classes supported.
   * @param {import("express").Express} app - the express instance to connect to.
   * @param {string} route - the route to listen on. Should not contain wildcards or pattern matches.
   */
  construct(app, route = "/zx-api/") {
    super();

    if (route.endsWith("/")) {
      route = route.substring(0, route.length - 1);
    }

    route = qx.lang.String.escapeRegexpChars(route);

    const RE_ROUTE = new RegExp(`^${route}`);

    app.all(`${route}/*`, async (req, res) => {
      let data = qx.lang.Object.clone(req.body, true);
      let path = zx.utils.Uri.breakoutUri(req.originalUrl).path.replace(RE_ROUTE, "");
      path = qx.lang.String.camelCase(path);
      data.path = path;
      data.restMethod = req.method; // TODO: we should only set this if we get a RESTful request; RPC should have no method

      let request = new zx.io.api.server.Request(this, data).set({ restMethod: req.method });
      let response = new zx.io.api.server.Response();
      await zx.io.api.server.ConnectionManager.getInstance().receiveMessage(request, response);

      if (response.getError()) {
        res.status(500).send(response.getError());
        return;
      }

      res.send(response.toNativeObject());

      // TODO: http server push
      // res.status(200).end();
      // for (let data of response.getData()) {
      //   this.postMessage(data);
      // }
    });
  },

  members: {
    postMessage() {},

    /**@override */
    supportsServerPush() {
      return false;
    }
  },

  statics: {
    /**
     * Middleware for express services. This middleware provides a JSON object at `req.body`, supporting communicating
     * certain additional classes, such as `Date`s, over the network. See {@link zx.utils.Json} for details on the
     * additional classes supported.
     * @example
     * ```js
     * app.use(zx.io.api.transport.http.ExpressServerTransport.jsonMiddleware());
     * ```
     */
    jsonMiddleware() {
      // TODO: test this middleware
      return (req, res, next) => {
        bodyParser.text()(req, res, () => {
          if (typeof req.body == "string") {
            req.body = zx.utils.Json.parseJson(req.body);
          }
          next();
        });
      };
    }
  }
});
