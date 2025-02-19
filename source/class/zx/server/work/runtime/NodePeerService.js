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
 * An app to host workers in a separated node process
 *
 * Uses express as the server platform
 */
qx.Class.define("zx.server.work.runtime.NodePeerService", {
  extend: zx.server.work.runtime.AbstractPeerService,

  construct(route = "/zx.work") {
    super(route);
  },

  members: {
    _onReady() {
      console.log("zx.server.work.pool.LocalhostPeerPool.READY_SIGNAL");
    }
  }
});
