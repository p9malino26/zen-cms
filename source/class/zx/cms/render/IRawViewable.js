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
 * Used by classes that that can generate all of their own content, directly to Fastify
 * without Nunjucks or other rendering
 */
qx.Interface.define("zx.cms.render.IRawViewable", {
  members: {
    /**
     * Called to handle the request and generate output
     * @param {import("fastify").FastifyRequest} request
     * @param {import("fastify").FastifyReply} reply
     */
    async generate(request, reply) {}
  }
});
