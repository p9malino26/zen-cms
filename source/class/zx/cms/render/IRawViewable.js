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
