qx.Class.define("zx.cms.content.CsvDownload", {
  extend: zx.io.persistence.Object,
  implement: [zx.cms.render.IRawViewable],

  properties: {
    title: {
      check: "String",
      event: "changeTitle"
    },

    contentType: {
      init: "text/csv; charset=UTF-8",
      check: "String",
      event: "changeContentType"
    },

    downloadFilename: {
      init: null,
      nullable: true,
      check: "String",
      event: "changeDownloadFilename"
    }
  },

  members: {
    /**
     * @Override
     */
    async generate(request, reply) {
      reply.header("Content-Type", this.getContentType());
      let filename = this.getDownloadFilename();
      if (filename) {
        reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      }

      //set properties equal to url parameters
      for (const key in request.query) {
        this.set(key, request.query[key]);
      }

      let data = await this._generateCsv();
      if (data instanceof qx.html.Node) {
        data = data.serialize();
      } else if (data && !(typeof data == "string")) {
        data = JSON.stringify(data, null, 2);
      }
      await reply.send(data || "");
    },

    async _generateCsv() {
      throw new Error("No such implementation for " + this.classname + "._generateCsv");
    }
  }
});
