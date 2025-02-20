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
 *    John Spackman (@johnspackman)
 *    Will Johnson (@willsterjohnsonatzenesis)
 *
 * ************************************************************************ */

/**
 * An IWorkerFactory creates workers for a worker pool
 */
qx.Interface.define("zx.server.work.IWorkerFactory", {
  members: {
    /**
     * creates a new instance
     *
     * Typically, this method will create a worker client api, spin up the worker runtime, and connect the client to the
     * server within the runtime.
     * @returns {Promise<zx.server.work.api.WorkerClientApi>}
     */
    async create() {},

    /**
     * Destroys an instance entirely
     *
     * Typically, this method will shutdown the worker runtime, and dispose of the worker client api and transports.
     * @param {zx.server.work.api.WorkerClientApi} client
     */
    async destroy(client) {}
  }
});
