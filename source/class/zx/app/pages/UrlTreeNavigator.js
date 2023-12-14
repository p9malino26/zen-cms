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

qx.Class.define("zx.app.pages.UrlTreeNavigator", {
  extend: zx.io.persistence.Object,
  implement: [zx.io.remote.IProxied],
  "@": zx.io.remote.anno.Class.DEFAULT,

  properties: {
    /** The root node, after `open` is called */
    rootNode: {
      init: null,
      nullable: true,
      check: "zx.app.pages.UrlNode",
      event: "changeRootNode",
      "@": zx.io.remote.anno.Property.DEFAULT
    },

    /** The prefix for URLs, used as a virtual root */
    prefix: {
      init: "pages",
      nullable: true,
      check: "String",
      event: "changePrefix",
      "@": zx.io.remote.anno.Property.DEFAULT
    }
  },

  members: {
    /**
     * Reads all the URLs from the database and creates a tree of `zx.app.pages.UrlNode`, starting
     * at `this.rootNode`
     */
    async open() {
      let prefix = this.getPrefix() || "";
      if (prefix.length) {
        if (prefix[0] == "/") {
          prefix = prefix.substring(1);
        }
        if (prefix.length && prefix[prefix.length - 1] == "/") {
          prefix = prefix.substring(0, prefix.length - 1);
        }
      }

      let query;
      if (!prefix) {
        query = { url: { $exists: true } };
      } else {
        query = { url: { $regex: "^" + prefix + "\\/", $options: "i" } };
      }

      prefix += "/";

      let cursor = await zx.server.Standalone.getInstance().getDb().find(zx.cms.content.Page, query, { _uuid: 1, url: 1 });
      let docs = [];
      let rootDoc = null;
      await cursor.sort("url").forEach(doc => {
        doc.originalUrl = doc.url;
        doc.url = doc.url.toLowerCase();
        if (doc.url.endsWith("/index")) {
          doc.url = doc.url.substring(0, doc.url.length - 5);
        }
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue(doc.url.startsWith(prefix));
        }
        doc.url = doc.url.substring(prefix.length);
        if (doc.url.length == 0) {
          rootDoc = doc;
        }
        docs.push(doc);
      });

      if (!rootDoc) {
        throw new Error("Cannot find root URL");
      }

      let root = new zx.app.pages.UrlNode().set({
        name: "",
        uuid: rootDoc._uuid
      });

      let docIndex = 1;
      const loadNodes = (parentNode, parentUrl) => {
        while (docIndex < docs.length) {
          let doc = docs[docIndex];
          let url = doc.url;
          if (!url.startsWith(parentUrl)) {
            return;
          }
          docIndex++;

          let remainder = url.substring(parentUrl.length);
          let pos = remainder.indexOf("/");
          if (pos > -1) {
            let segs = remainder.split("/");
            let node = new zx.app.pages.UrlNode().set({
              name: segs[0],
              parentNode: parentNode
            });
            parentNode.getChildren().add(node);
            loadNodes(node, parentUrl + segs[0] + "/");
          } else {
            let node = new zx.app.pages.UrlNode().set({
              name: remainder,
              parentNode: parentNode
            });
            parentNode.getChildren().add(node);
          }
        }
      };

      loadNodes(root, "/");
      this.setRootNode(root);
    }
  }
});
