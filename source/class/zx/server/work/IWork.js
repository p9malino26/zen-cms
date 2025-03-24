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
*
* ************************************************************************ */

/**
 * Represents a piece of work to be executed by an instance of zx.server.work.IWorker
 */
qx.Interface.define("zx.server.work.IWork", {
  members: {
    /**
     * Executes the work
     *
     * @param {zx.server.work.IWorker} worker the Worker that is executing this Work
     * @returns {Promise<>} A promise that resolves when the work is complete
     */
    async execute(worker) {}
  }
});
