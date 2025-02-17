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

/**
 * Client api for work scheduling
 */
qx.Class.define("zx.work.api.SchedulerClientApi", {
  extend: zx.io.api.client.AbstractClientApi,

  /**
   *
   * @param {zx.io.api.server.AbstractServerTransport} transport
   * @param {string} path
   */
  construct(transport, path) {
    super(transport, "zx.work.api.SchedulerApi", ["schedule", "poll", "push"], path);
  }
});
