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
 * Provides an endpoint implementation for postMessage via `window`
 *
 */
qx.Class.define("zx.io.remote.WindowEndpoint", {
  extend: zx.io.remote.NetworkEndpoint,

  /**
   * Constructor
   * @param win {Window} the remote window that this endpoint is for
   */
  construct(win) {
    this.base(arguments);
    this.__window = win;
    this.__pending = {};
    window.addEventListener("message", event => this._onMessage(event));
  },

  members: {
    __window: null,
    __flushTimerId: null,

    /**
     * Starts/restarts the timer before flushing the queue
     */
    __startFlushTimer() {
      this.__cancelFlushTimer();
      this.__flushTimerId = setTimeout(
        () => this.__onFlushTimeout(),
        zx.io.remote.WindowEndpoint.__MAX_DELAY_BEFORE_FLUSHING
      );
    },

    /**
     * Cancels the timer before flushing the queue
     */
    __cancelFlushTimer() {
      if (this.__flushTimerId) {
        clearTimeout(this.__flushTimerId);
        this.__flushTimerId = null;
      }
    },

    /**
     * Callback to flush the queue
     */
    __onFlushTimeout() {
      this.flush();
    },

    /**
     * Tests whether the given window matches the remote window this Endpoint is for
     */
    isWindow(window) {
      return this.__window === window;
    },

    /**
     * @Override
     */
    _flushImpl(queuedPackets) {
      this.__cancelFlushTimer();
      this.__window.postMessage({
        signature: this.classname,
        packets: queuedPackets,
      });
    },

    /**
     * @Override
     */
    _queuePacket(packet) {
      this.base(arguments, packet);
      this.__startFlushTimer();
    },

    /**
     * Event handler for messages received via `postMessage`
     * @param {*} event
     * @returns
     */
    async _onMessage(event) {
      if (!this.isWindow(event.source)) return;

      let msgData = event.data;
      if (msgData.signature !== this.classname) return;
      let responses = await this._receivePackets(msgData.packets);
      if (responses && responses.length) {
        this.__window.postMessage({
          signature: this.classname,
          packets: responses,
        });
      }
    },
  },

  statics: {
    /** @type{Integer} max time to wait before flushing the queue, in milliseconds */
    __MAX_DELAY_BEFORE_FLUSHING: 500,
  },
});
