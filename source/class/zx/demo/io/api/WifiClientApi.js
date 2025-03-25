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
 *    Patryk Malinowski (@p9malino26)
 *
 * ************************************************************************ */

qx.Class.define("zx.demo.io.api.WifiClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  construct(transport) {
    super(transport, "zx.demo.io.api.WifiApi", ["isOnline"]);
  }
});
