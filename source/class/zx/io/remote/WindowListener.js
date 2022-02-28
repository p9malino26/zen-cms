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
 * Listens for messages sent via `postMessage` from previously unknown windows,
 * creates `WindowEndpoint` as necessary and forwards the message
 */
qx.Class.define("zx.io.remote.WindowListener", {
  extend: qx.core.Object,

  construct(controller) {
    this.base(arguments);
    this.__controller = controller;
    window.addEventListener("message", event => this._onMessage(event));
  },

  members: {
    /**
     * Event handler for "message" on the global `window`
     *
     * @param {*} event
     * @returns
     */
    async _onMessage(event) {
      let endPoint = this.__controller.findEndpoint(
        endPoint =>
          endPoint instanceof zx.io.remote.WindowEndpoint &&
          endPoint.isWindow(event.source)
      );
      if (endPoint) return null;
      endPoint = new zx.io.remote.WindowEndpoint(event.source);
      await this.__controller.addEndpoint(endPoint);
      endPoint.open();
      return endPoint._onMessage(event);
    },
  },
});
