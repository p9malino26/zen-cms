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


const path = require("path");
const nunjucks = require("nunjucks");
const chokidar = require("chokidar");

/**
 * Implementation of a view that renders using Nunjucks
 */
qx.Class.define("zx.cms.render.NunjucksController", {
  extend: qx.core.Object,

  construct(theme) {
    this.base(arguments);
    const NC = zx.cms.render.NunjucksController;
    if (NC.__instance)
      throw new Error("Multiple instances of " + this.classname);
    NC.__instance = this;

    if (theme) this.setTheme(theme);

    let loader = new NC.QooxdooCmsLoader();
    loader.controller = this;
    this.__env = new nunjucks.Environment(loader);
    this.__env.addExtension(
      "renderPiece",
      new zx.cms.render.NjRenderPiece().getExtension()
    );

    this.__filenamesToUris = {};
    this._watcher = chokidar.watch();

    let flushAll = filename => {
      Object.keys(this.__filenamesToUris).forEach(filename => {
        let uris = this.__filenamesToUris[filename];
        if (uris) {
          Object.keys(uris).forEach(uri =>
            loader.emit("update", uri, filename)
          );
        }
      });
    };
    this._watcher.on("add", flushAll);
    this._watcher.on("unlink", flushAll);
    this._watcher.on("change", filename => {
      let uris = this.__filenamesToUris[filename];
      if (uris) {
        if (qx.core.Environment.get("qx.debug")) {
          this.debug(
            `Change: ${filename} :: ${JSON.stringify(Object.keys(uris))}`
          );
        }
        Object.keys(uris).forEach(uri => loader.emit("update", uri, filename));
      }
    });
    this._watcher.on("error", error => {
      this.error("Watcher error: " + error);
    });
  },

  destruct() {
    if (zx.cms.render.NunjucksController.__instance === this)
      zx.cms.render.NunjucksController.__instance = null;
  },

  members: {
    /** @type{zx.cms.render.Theme} the theme */
    __theme: null,

    /** @type{Chokidar} the watcher used to detect changes in files and inform Nunjucks to invalidate it's cache */
    _watcher: null,

    /** @type{Map} This records a list of Nunjucks URIs that resolved to files that were loaded and
     * parsed; note that Nunjucks will cache the result of parsing, so when a file changes we need
     * to tell Nunjucks that all of the URIs which loaded that file are now invalid and need to
     * be reloaded
     */
    __filenamesToUris: null,

    /**
     * Loads the source for a template, called by the custom QooxdooCmsLoader for nunjucks
     *
     * @param uri {String} the filename URI
     * @return {String}
     */
    async getSource(uri) {
      const NC = zx.cms.render.NunjucksController;

      let breakdown = NC.parseFilename(uri);
      let classname = breakdown.scope || breakdown.query.classname || null;
      let ctlr = classname
        ? zx.cms.render.Controller.getController(classname)
        : null;
      this.assertTrue(
        (classname === null && ctlr === null) ||
          (classname !== null && ctlr !== null)
      );
      let template = await zx.cms.render.Resolver.resolveTemplate(
        ctlr,
        this.__theme,
        breakdown.template
      );
      if (!template) {
        this.error(`Cannot find template source for ${uri}`);
        return null;
      }

      let source = await this.__parse(template, uri);

      return {
        src: source,
        path: template.toUri()
      };
    },

    /**
     * Helper method to get the source from a template and parse it
     *
     * @param template {Template} the template to parse
     * @param uri {String?} the URI that loaded this template
     */
    async __parse(template, uri) {
      let source = await template.getSource();
      let classname = template.getViewableClassname();
      let query = {};
      if (classname) query.classname = classname;
      source = zx.cms.render.NunjucksController.parseTemplate(source, query);

      let filename = template.getWatchFilename();
      if (filename) {
        try {
          filename = path.resolve(filename);
        } catch (ex) {
          filename = null;
        }
        if (filename) {
          let uris = null;
          if (uri) {
            uris = this.__filenamesToUris[filename];
            if (!uris) uris = this.__filenamesToUris[filename] = {};
            uris[uri] = true;
          }
          if (qx.core.Environment.get("qx.debug")) {
            this.debug(
              `Watching ${filename} :: ${
                uris ? JSON.stringify(Object.keys(uris)) : ""
              }`
            );
          }
          this._watcher.add(filename);
        }
      }

      return source;
    },

    /**
     * Called to render a template
     *
     * @param template {Template} the template to render
     * @param context {Map} the context to render the template with
     * @return {String}
     */
    async render(template, context) {
      let source = await this.__parse(template);
      let result = await zx.utils.Promisify.call(cb =>
        this.__env.renderString(
          source,
          context,
          {
            path: template.toUri()
          },
          (err, result) => {
            if (err) err.message += `\n in ${template}`;
            cb(err, result);
          }
        )
      );
      return result;
    },

    /**
     * Sets the Theme to use
     *
     * @param theme {Theme} the new theme
     */
    setTheme(theme) {
      this.__theme = theme;
    }
  },

  statics: {
    __instance: null,
    QooxdooCmsLoader: null,

    /**
     * Returns the singleton instance
     */
    getInstance() {
      return zx.cms.render.NunjucksController.__instance;
    },

    /**
     * Parses a filename in the form "[scope:]filename[?key[=value][&key=value[...]]" and
     * returns a map containing `filename` (a String), `scope` (a String) and `query`
     * (a Map).  The values in the `query` map are either a String, or `true` if no `"="`
     * was provided
     *
     * @param filename {String} the filename to parse
     * @return {Map}
     *  filename {String} the filename part
     *  scope {String?} the scope part, or null if not found
     *  query {Map} the key=value query parts of the filename
     */
    parseFilename(filename) {
      let query = {};
      let pos = filename.indexOf("?");
      if (pos > -1) {
        let queryString = filename.substring(pos + 1);
        filename = filename.substring(0, pos);
        queryString.split("&").forEach(seg => {
          let m = seg.match(/^([^=]+)(=(.*))?$/);
          let key = m[1];
          let value = m[3];
          if (value === undefined) value = true;
          query[key] = value;
        });
      }

      pos = filename.indexOf(":");
      let scope = null;
      if (pos > 0) {
        scope = filename.substring(0, pos);
        filename = filename.substring(pos + 1);
      }

      return {
        scope,
        filename,
        query,
        template: filename.replace(/\.html$/, "")
      };
    },

    /**
     * Parses a Nunjucks template to modify the `include`, `import` and `extends` tags
     * to include extra informtion in the filename; this is necessary because Nunjucks
     * does not provide any information about which file is causing `getSource()` to
     * be called on the loader, and we need to know in order to be able to discover the
     * correct file according to the heirarchy
     *
     * @param source {String} the source to parse
     * @param query {String|Map} the query data to add to the filename
     * @return {String} the modified code
     */
    parseTemplate(source, query) {
      const TAG_NAMES = {
        extends: true,
        import: true,
        include: true
      };

      let strQuery = null;
      if (typeof query == "string") strQuery = query;
      else if (query) {
        strQuery = Object.keys(query)
          .map(key => {
            let value = query[key];
            if (value === null) return key;
            if (value === undefined) return;
            return key + "=" + value;
          })
          .filter(value => !!value)
          .join("&");
      }
      if (!strQuery) return source;

      let searchStartPos = 0;
      while (true) {
        // Find the next tag
        let pos = source.indexOf("{%", searchStartPos);
        if (pos < 0) break;
        let endPos = source.indexOf("%}", pos + 2);
        if (endPos < 0) break;

        // Extract the tag name and filename
        let tag = source.substring(pos + 2, endPos);
        let m = tag.match(/^(\s*)([a-z]+)\s*['"]([^'"]*)['"](.*)$/i);
        if (!m) {
          searchStartPos = endPos + 2;
          continue;
        }
        let prefix = m[1];
        let tagname = m[2];
        if (!TAG_NAMES[tagname]) {
          searchStartPos = endPos + 2;
          continue;
        }

        let filename = m[3];
        let remainder = m[4];

        let before = source.substring(0, pos + 2);
        let after = source.substring(endPos);

        // Add the query data
        pos = filename.indexOf("?");
        if (pos < 0) filename += "?";
        else filename += "&";
        filename += strQuery;
        let replacement = prefix + tagname + ' "' + filename + '"' + remainder;
        source = before + replacement + after;
        searchStartPos = before.length + remainder.length + 2;
      }

      return source;
    }
  },

  defer(statics) {
    const NC = zx.cms.render.NunjucksController;
    NC.QooxdooCmsLoader = nunjucks.Loader.extend({
      async: true,

      // Set to the actual NunjucksController instance
      controller: null,

      getSource: function (name, callback) {
        this.controller
          .getSource(name)
          .then(data => {
            qx.log.Logger.debug("Loaded template for " + name);
            callback(null, data);
          })
          .catch(err => {
            debugger;
            callback(err);
          });
      }
    });
  }
});
