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

const nunjucks = require("nunjucks");

qx.Class.define("zx.cms.render.NjRenderPiece", {
  extend: qx.core.Object,

  members: {
    parse(parser, nodes, lexer) {
      // get the tag token
      let token = parser.nextToken();

      // parse the args and move after the block end. passing true
      // as the second arg is required if there are no parentheses
      var args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(token.value);

      // See above for notes about CallExtension
      return new nodes.CallExtensionAsync("renderPiece", "run", args, []);
    },

    run(context, args, callback) {
      const impl = async () => {
        let server = zx.server.Standalone.getInstance();
        let content = await server.getRenderer().renderPiece(args);
        return new nunjucks.runtime.SafeString(content);
      };
      impl()
        .then(data => callback(null, data))
        .catch(callback);
    },

    getExtension() {
      return {
        tags: ["renderPiece"],
        parse: (...args) => this.parse(...args),
        run: (...args) => this.run(...args)
      };
    }
  }
});
