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

/**
 * Provides a nodejs-based implementation of zx.server.rest.RestApiClient
 */

const request = require("request-promise-native");

qx.Class.define("zx.server.rest.RestApiClientNode", {
  extend: zx.server.rest.RestApiClient,

  members: {
    /**
     * @Override
     */
    async _callApiImpl(httpMethod, url, body, cookieStore, onSuccess, onError) {
      let jar = request.jar(cookieStore);
      cookieStore.getAllCookiesSync().forEach(cookie => this.debug(`API sending ${cookie.key}=${cookie.value}`));
      try {
        let data = await request({
          uri: url,
          method: httpMethod,
          body: body,
          json: true,
          jar: jar
        });
        cookieStore.getAllCookiesSync().forEach(cookie => this.debug(`API received ${cookie.key}=${cookie.value}`));
        onSuccess(data);
      } catch (ex) {
        onError(ex);
      }
    }
  }
});
