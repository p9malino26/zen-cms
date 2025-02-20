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
 * This interface represents the shape of the POJO used to specify a work item (zx.server.work.IWork)
 * that is sent from the scheduler to the worker (zx.server.work.IWorker)
 */
qx.Interface.define("zx.server.work.IWorkSpec", {
  members: {
    /**
     * A uuid for the work item
     * @type {string}
     */
    uuid: null,

    /**
     * The classname of the work item, must implement {@link zx.server.work.IWork}
     * @type {string}
     */
    classname: null,

    /**
     * The compatibility is an array of classnames referencing {@link zx.server.work.pool.AbstractWorkerPool}s that provide an environment
     * this work can run in. To accept any and all environments, pass an empty array.
     * @type {string[]}
     */
    compatibility: null,

    /**
     * Arguments to pass to the work item constructor. Note that the first argument will always be the uuid, and these
     * arguments will follow after.
     * @type {any[]}
     */
    args: null
  }
});
