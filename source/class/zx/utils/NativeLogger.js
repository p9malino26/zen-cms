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
 * A simple logger that logs to the native console - this is a replacement for qx.log.appender.Native
 * that always outputs to the console.
 */
qx.Class.define("zx.utils.NativeLogger", {
  statics: {
    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process(entry) {
      var formatter = qx.log.appender.Formatter.getFormatter();
      var args = formatter.toText(entry);

      // Node suppresses debug messages except in the debugger
      console.log(args);
    }
  }
});
