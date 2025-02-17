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
 *
 */
qx.Class.define("zx.work.api.WorkerClientApi", {
  extend: zx.io.api.client.AbstractClientApi,
  implement: [zx.work.IWorker],

  /**
   *
   * @param {zx.io.api.client.AbstractClientTransport} transport
   * @param {string} path
   */
  construct(transport, path) {
    super(transport, "zx.work.api.WorkerApi", ["run"], path);
  },

  members: {
    /**
     * @override zx.work.IWorker#run
     */
    run(work) {
      //Nothing. This method is defined on the WorkerServerApi.
    }
  }
});
