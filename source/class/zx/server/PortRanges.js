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
 *
 * ************************************************************************ */

qx.Class.define("zx.server.PortRanges", {
  extend: qx.core.Object,

  statics: {
    /** @type{zx.utils.Range} allocatable port range for debuggable child node processes */
    __NODE_DEBUG_PORT_RANGE: new zx.utils.Range(9000, 10000),

    /** @type{zx.utils.Range} allocatable port range for Chromium poirts */
    __CHROMIUM_PORT_RANGE: new zx.utils.Range(11000, 11999),

    /** @type{zx.utils.Range} allocatable port range for Node child processes' HTTP server API */
    __NODE_HTTP_SERVER_API_PORT_RANGE: new zx.utils.Range(10000, 10999),

    /**
     * Range of ports to allocate for debuggable node processes
     *
     * @returns {zx.utils.Range} the range
     */
    getNodeDebugPortRange() {
      return zx.server.PortRanges.__NODE_DEBUG_PORT_RANGE;
    },

    /**
     * Range of ports to allocate for Chromium
     *
     * @returns {zx.utils.Range} the range
     */
    getChromiumPortRange() {
      return zx.server.PortRanges.__CHROMIUM_PORT_RANGE;
    },

    /**
     * Range of ports to allocate for server apis in child processes
     *
     * @returns {zx.utils.Range} the range
     */
    getNodeHttpServerApiPortRange() {
      return zx.server.PortRanges.__NODE_HTTP_SERVER_API_PORT_RANGE;
    }
  }
});
