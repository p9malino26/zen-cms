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

qx.Class.define("zx.utils.PostMessageRelayLogger", {
  extend: qx.core.Object,

  statics: {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process(entry) {
      var formatter = qx.log.appender.Formatter.getFormatter();
      var output = formatter.formatEntryObjectAndClass(entry);
      var str = formatter.formatEntryItems(entry);
      if (str) {
        output += " " + str;
      }
      window.parent.postMessage({
        signature: zx.utils.PostMessageRelayLogger.classname,
        loggerName: entry.loggerName,
        level: entry.level,
        message: output
      });
    },

    __originCallbacks: {},

    addOriginCallback(url, fn) {
      if (!fn) {
        delete zx.utils.PostMessageRelayLogger.__originCallbacks[url];
      } else zx.utils.PostMessageRelayLogger.__originCallbacks[url] = fn;
    },

    /**
     * Starts the receiver for remote logging.  The callback, if provided, is called
     * with the message object containing `message`, `loggerName` and `level`.
     *
     * If `setOriginCallback` has been used and the origin is matched, it will take priority
     * over `fn`
     *
     * @param {Function?} fn function to call with the message, if null then global logger is used
     */
    startReceiver(fn) {
      window.addEventListener("message", evt => {
        let data = evt.data;
        if (data.signature !== zx.utils.PostMessageRelayLogger.classname) {
          return;
        }
        let sourceUrl = evt.source.document.location.pathname;
        let sourceFn = zx.utils.PostMessageRelayLogger.__originCallbacks[evt.source.document.location.href];

        if (!sourceFn) {
          sourceFn = zx.utils.PostMessageRelayLogger.__originCallbacks[evt.source.document.location.pathname];
        }

        if (sourceFn) {
          sourceFn(data);
        } else if (fn) {
          fn(data);
        } else qx.log.Logger[data.level]("[IFRAME] " + data.message);
      });
    }
  }
});
