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

const readline = require("readline");

qx.Class.define("zx.utils.Readline", {
  extend: qx.core.Object,

  statics: {
    /**
     * Asks a question
     *
     * @typedef {Objects} Options
     * @property {Boolean} hidden if true, then keys are not echod (for passwords)
     *
     * @param question {String} the question to ask
     * @param options {Options?}
     * @return {Promise<String>} the answer
     */
    question(question, options) {
      return new Promise((resolve, reject) => {
        options = options || {};
        let output = process.stdout;
        let input = process.stdin;
        const rl = readline.createInterface({ input, output });

        if (options.hidden) {
          const onDataHandler = charBuff => {
            const char = charBuff + "";
            switch (char) {
              case "\n":
              case "\r":
              case "\u0004":
                input.removeListener("data", onDataHandler);
                break;
              default:
                output.clearLine(0);
                readline.cursorTo(output, 0);
                output.write(question);
                break;
            }
          };
          input.on("data", onDataHandler);
        }

        rl.question(question, answer => {
          if (options.hidden) rl.history = rl.history.slice(1);
          rl.close();
          resolve(answer);
        });
      });
    }
  }
});
