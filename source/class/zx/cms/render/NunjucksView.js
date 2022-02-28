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
 * Implementation of a view that renders using Nunjucks
 */
qx.Class.define("zx.cms.render.NunjucksView", {
  extend: zx.cms.render.View,

  construct(template) {
    this.base(arguments);
    this.__template = template;
  },

  members: {
    /*
     * @Override
     */
    async render(rendering, viewable, context) {
      let nc = zx.cms.render.NunjucksController.getInstance();
      let result = await nc.render(this.__template, context);
      rendering.send(result);
    }
  }
});
