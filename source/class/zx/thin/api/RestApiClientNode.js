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
 * Provides a nodejs-based implementation of zx.thin.api.AbstractRestApiClient
 */

const request = require("request-promise-native");

qx.Class.define("zx.thin.api.RestApiClientNode", {
  extend: zx.thin.api.AbstractRestApiClient,

  members: {
    /**
     * @Override
     */
    async _callApiImpl(httpMethod, url, body, cookieStore, onSuccess, onError) {
      let jar = request.jar(cookieStore);
      cookieStore
        .getAllCookiesSync()
        .forEach(cookie =>
          this.debug(`API sending ${cookie.key}=${cookie.value}`)
        );
      await request({
        uri: url,
        method: httpMethod,
        body: body,
        json: true,
        jar: jar
      })
        .then(data => {
          cookieStore
            .getAllCookiesSync()
            .forEach(cookie =>
              this.debug(`API received ${cookie.key}=${cookie.value}`)
            );
          onSuccess(data);
        })
        .catch(onError);
    }
  }
});
