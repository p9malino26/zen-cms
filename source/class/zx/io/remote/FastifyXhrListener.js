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


/*
 * Simple server implementation to pair with XhrEndpoint
 *
 */
qx.Class.define("zx.io.remote.FastifyXhrListener", {
  extend: qx.core.Object,

  construct(controller) {
    this.base(arguments);
    this.__controller = controller;
  },

  environment: {
    "zx.io.remote.FastifyXhrListener.sessionTracing": false
  },

  members: {
    /**
     * ExpressJS/Fastify middleware for API calls
     *
     * @param req {http.Request} the request
     * @param reply {Fastify.Reply} the response
     */
    async middleware(req, reply) {
      const path = req.url;
      try {
        await this._receive(req, reply);
      } catch (ex) {
        qx.log.Logger.error(
          `Exception during API call to '${path}': ${ex.stack || ex}`
        );
        reply.code(500).send("" + (ex.message || ex));
      }
    },

    /**
     * Handles the API call for this API
     *
     * @param req {http.Request} the request
     * @param reply {Fastify.Reply} the response
     */
    async _receive(req, reply) {
      if (!req.session[this.classname]) req.session[this.classname] = {};
      if (!req.session[this.classname].endpoints)
        req.session[this.classname].endpoints = {};
      let endpoints = req.session[this.classname].endpoints;

      // localSessionId is just a unique identifier that we use to index into datasource endpoints, because datasource
      //  is global, and we need to reduce the scope down to just the one browser
      let localSessionId = req.session[this.classname].localSessionId || null;
      if (!localSessionId) {
        localSessionId = "" + ++zx.io.remote.FastifyXhrListener.__lastSessionId;
        req.session[this.classname].localSessionId = localSessionId;
      }

      // Each browser can have multiple endpoints simultaneously, for example in a thin client in an iframe as well as
      //  a thick client Desktop app
      let remoteSessionId = req.headers["x-zx-io-remote-sessionuuid"];
      let remoteAppName = req.headers["x-zx-io-remote-applicationname"];
      if (
        qx.core.Environment.get(
          "zx.io.remote.FastifyXhrListener.sessionTracing"
        )
      ) {
        console.log(
          `localSessionId=${localSessionId}, remoteSessionId=${remoteSessionId}, remoteAppName=${remoteAppName}`
        );
        this.debug(`RECEIVE START: remoteSessionId=${remoteSessionId}`);
      }

      // The first request will restart the endpoint no matter what
      let firstRequest = req.headers["x-zx-io-remote-firstrequest"] == "true";

      // Find the existing endpoint
      let endpoint = this.__controller.findEndpoint(
        "Xhr:" + localSessionId + ":" + remoteAppName
      );

      // Close previous endpoints if this is the first request (unlikely to be needed, because the remoteSessionId would
      //  be expected to have changed)
      if (endpoint && endpoints[remoteAppName]) {
        if (endpoints[remoteAppName].remoteSessionId != remoteSessionId) {
          firstRequest = true;
          if (
            qx.core.Environment.get(
              "zx.io.remote.FastifyXhrListener.sessionTracing"
            )
          ) {
            this.debug(
              `Existing endpoint but with wrong session id, NEW remoteSessionId=${remoteSessionId} EXISTING endpoints[${remoteAppName}].remoteSessionId=${
                endpoints[remoteAppName].remoteSessionId
              } (${endpoint.toHashCode()})`
            );
          }
        }
      }

      if (
        qx.core.Environment.get(
          "zx.io.remote.FastifyXhrListener.sessionTracing"
        )
      ) {
        if (endpoints[remoteAppName])
          this.debug(
            `endpoints[${remoteAppName}].remoteSessionId=${endpoints[remoteAppName].remoteSessionId}`
          );
        else this.debug(`endpoints[${remoteAppName}] is undefined`);
        this.debug(
          `endpoint=${
            endpoint ? endpoint.getUuid() : "(null)"
          }, localSessionId=${localSessionId}, indexes=${JSON.stringify(
            this.__controller.getEndpointIndexes()
          )}`
        );
      }

      let promises = [];

      if (endpoint && firstRequest) {
        if (
          qx.core.Environment.get(
            "zx.io.remote.FastifyXhrListener.sessionTracing"
          )
        ) {
          this.debug(
            `Closing existing endpoint uuid=${endpoint.getUuid()} (${endpoint.toHashCode()}) remoteSessionId=${remoteSessionId}}`
          );
        }
        promises.push(endpoint.close());
        endpoint = null;
      }
      if (firstRequest) delete endpoints[remoteAppName];

      // If no endpoint, then create one
      if (!endpoint) {
        endpoint = new zx.io.remote.FastifyXhrEndpoint(
          "Xhr:" + localSessionId + ":" + remoteAppName,
          remoteSessionId
        );
        this.debug(
          `Opening new endpoint localSessionId=${localSessionId}, remoteAppName=${remoteAppName}, remoteSessionId=${remoteSessionId} (${endpoint.toHashCode()})`
        );
        endpoint.open();
        promises.push(this.__controller.addEndpoint(endpoint));
      }

      // Store the endpoint's last-seen time
      if (!endpoints[remoteAppName]) endpoints[remoteAppName] = {};
      endpoints[remoteAppName].remoteSessionId = remoteSessionId;
      endpoints[remoteAppName].lastSeen = new Date().getTime();

      // Remove expired endpoints
      let oldestEndpoint =
        new Date().getTime() -
        zx.io.remote.FastifyXhrListener.__MAX_AGE_UNUSED_ENDPOINTS;
      for (let key in endpoints) {
        let lastSeen = endpoints[key].lastSeen;
        if (lastSeen < oldestEndpoint) {
          delete endpoints[key];
          let expiredEndpoint = this.__controller.findEndpoint(
            "Xhr:" + localSessionId + ":" + key
          );
          if (expiredEndpoint) {
            if (
              qx.core.Environment.get(
                "zx.io.remote.FastifyXhrListener.sessionTracing"
              )
            ) {
              this.debug(
                `Closing expired end point key=${key}, expiredEndpoint=${expiredEndpoint} (${expiredEndpoint.toHashCode()})`
              );
            }
            expiredEndpoint.close();
          }
        }
      }

      await qx.Promise.all(promises);

      // Forward the packet
      let result = await endpoint._receive(req, reply);

      if (
        qx.core.Environment.get(
          "zx.io.remote.FastifyXhrListener.sessionTracing"
        )
      ) {
        this.debug(
          `RECEIVE END: remoteSessionId=${remoteSessionId} endpoints[${remoteAppName}].remoteSessionId=${
            endpoints[remoteAppName].remoteSessionId
          } (${endpoint.toHashCode()}), localSessionId=${localSessionId}, indexes=${JSON.stringify(
            this.__controller.getEndpointIndexes()
          )}`
        );
      }
      return result;
    }
  },

  statics: {
    __lastSessionId: 0,

    /** @type{Integer} max age of sessions which have not sent a packet, in milliseconds */
    __MAX_AGE_UNUSED_ENDPOINTS: 10 * 60 * 1000
  }
});
