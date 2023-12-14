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

const cheerio = require("cheerio");

qx.Class.define("zx.test.cms.TestRendering", {
  extend: qx.dev.unit.TestCase,

  members: {
    async _getBody(urlPath) {
      let server = zx.server.Standalone.getInstance();
      let object = await server.getObjectByUrl(zx.cms.content.Page, urlPath);
      if (!object) return null;
      let rendering = new zx.cms.render.MemoryRendering();
      await server.getRenderer().renderViewable(rendering, object);
      let body = rendering.getBody();
      return body;
    },

    async testSinglePiece() {
      let html = await this._getBody("pages/tests/test-container-piece");
      this.assertNotNull(html);

      let $ = cheerio.load(html);
      let children = $("#content").children();

      this.assertNumber(3, children.length);
      this.assertString("My Header", $("h1", children).text());
      this.assertString("infoboxes qxl-container-vertical", $(children[1]).attr("class"));

      let boxes = $(".infobox", children[1]);
      this.assertNumber(4, children.length);
      boxes.toArray().forEach((box, index) => {
        this.assertString("infobox", $(box).attr("class"));
        this.assertString("Sub Piece " + (index + 1), $("h2", box).text());
      });
    }
  }
});
