qx.Class.define("zx.server.email.EmailApi", {
  extend: zx.server.Object,
  "@": new zx.io.remote.anno.Class(),
  include: [uk.co.spar.services.MMongoClient],

  construct() {
    super();
    this.__initPromise = this.__init();
  },

  members: {
    async __init() {
      this.__messageCollection = await zx.server.Standalone.getInstance().getDb().getCollection("zx.server.email.Message");
    },

    "@searchEmails": zx.io.remote.anno.Method.DEFAULT,
    async searchEmails(query, limit) {
      await this.__initPromise;

      let pipeline;
      if (query?.length) {
        pipeline = [
          {
            $match: {
              $text: {
                $search: query,
                $caseSensitive: false,
                $diacriticSensitive: false
              }
            }
          },
          { $set: { score: { $meta: "textScore" } } },
          { $sort: { score: -1 } },
          { $limit: limit || 100 }
        ];
      } else {
        pipeline = [{ $sort: { dateQueued: -1 } }, { $limit: limit || 100 }];
      }
      let cursor = this.__messageCollection.aggregate(pipeline);
      let result = await cursor.toArray();
      return result;
    }
  }
});
