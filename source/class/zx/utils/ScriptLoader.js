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
 * Loads external scripts asynchronously, making sure that each script is only loaded once and provides
 * support for a sequence of scripts (ie where a second script can only be loaded once a previous
 * script has finished uploading).
 *
 * Relative URLs should be used with care - they are relative to the .html page used to load the application,
 * which changes for source vs build generations, eg ./myapp/source/script/index.html vs
 * ./myapp/build/script/index.html.
 *
 * URLs can be prefixed with an alias in curly brackets that is replaced with an environment mapping in
 * config.json or from zx.utils.ScriptLoader.mapUrl; for example, given the environment key:
 *
 * 		"zx.utils.ScriptLoader.uris.ace": "/public/ace/src"
 *
 * Loading the urls "{ace}/ace.js" and "{ace}/theme-textmate.js" will be mapped to "/public/ace/src/ace.js"
 * and "/public/ace/src/theme-textmate.js"
 */
qx.Class.define("zx.utils.ScriptLoader", {
  extend: qx.core.Object,

  statics: {
    __loading: {},
    __loaded: {},

    /**
     * Resolves a URL by replacing any substitution mappings
     * @param url
     * @returns
     */
    resolveUrl(url) {
      var source = qx.util.AliasManager.getInstance().resolve(url);
      source = qx.util.ResourceManager.getInstance().toUri(source);
      return source;
    },

    /**
     * Loads an array of scripts, all asynchronously but in strict sequence
     * @param urls {String[]} scripts to load
     * @param callback {Function} callback function for when all specified scripts are loaded
     * @param context {Object} 'this' for callback
     */
    __loadScriptBundle(urls, callback, context) {
      if (urls.length == 0) {
        if (callback) {
          callback.call(context || this);
        }
        return;
      }
      var resolved = urls.shift();
      this.loadScript(resolved, () => this.__loadScriptBundle(urls, callback, context));
    },

    /**
     * Loads a script(s) from URL(s), does not allow a script to be loaded more than once
     * @param url {String|String[]} script to load, or an array of scripts
     * @param callback {Function} callback function for when all specified scripts are loaded
     * @param context {Object} 'this' for callback
     * @return this, for chaining
     */
    loadScript(url, callback, context) {
      if (qx.lang.Type.isArray(url)) {
        this.__loadScriptBundle(url.slice(0), callback, context);
      } else {
        var resolved = this.resolveUrl(url);
        if (this.__loaded[url]) {
          if (callback) {
            callback.call(context || this, url);
          }
          return;
        }

        var loading = this.__loading[url];
        if (!loading) {
          loading = this.__loading[url] = { callbacks: [] };
          this.__createScriptElement(url, resolved);
        }
        if (callback) {
          loading.callbacks.push({ callback: callback, context: context });
        }
      }
      return this;
    },

    /**
     * Loads a stylesheet from URL(s), does not allow a stylesheet to be loaded more than once.
     * 	note that unlike loadScript, callbacks when the stylesheet has loaded are not supported
     * @param urls {String|String[]} the url(s) to load
     * @return this, for chaining
     */
    loadStylesheet(urls) {
      if (!qx.lang.Type.isArray(urls)) {
        urls = [urls];
      }
      for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        if (!this.__loaded[url]) {
          var resolved = this.resolveUrl(url);
          this.__createLinkElement(resolved);
          this.__loaded[url] = true;
        }
      }
      return this;
    },

    /**
     * Detects whether the script(s) have been loaded or not
     * @param urls {String|String[]} the url(s) to check for
     * @returns {Boolean} true if they are all loaded
     */
    isLoaded(urls) {
      if (!qx.lang.Type.isArray(urls)) {
        urls = [urls];
      }
      for (var i = 0; i < urls.length; i++) {
        var url = urls[i];
        if (!this.__loaded[url]) {
          return false;
        }
      }
      return true;
    },

    /**
     * DOM event handler for when the script element has loaded
     * @param elem
     */
    __onScriptLoaded(elem) {
      var url = elem.getAttribute("data-zx-utils-scriptloader-url"),
        current = this.__loading[url];
      delete this.__loading[url];
      this.__loaded[url] = true;
      for (var i = 0; i < current.callbacks.length; i++) {
        var data = current.callbacks[i];
        data.callback.call(data.context || this, url);
      }
    },

    /**
     * Creates the asynchronous DOM SCRIPT element and adds it to the document
     * @param url
     * @returns {DOM} SCRIPT tag
     */
    __createScriptElement(url, resolved) {
      var self = this;
      var script = document.createElement("script");
      script.async = "async";
      script.type = "text/javascript";
      script.setAttribute("data-zx-utils-scriptloader-url", url);
      //qx.log.Logger.debug(self, "adding script url=" + url + ", resolved=" + resolved);
      script.onload = script.onreadystatechange = function () {
        script.onload = script.onreadystatechange = null;
        //qx.log.Logger.debug(self, "finished loading script url=" + url + ", resolved=" + resolved);
        zx.utils.ScriptLoader.__onScriptLoaded(this);
      };
      script.src = resolved;
      document.getElementsByTagName("head")[0].appendChild(script);
      return script;
    },

    /**
     * Creates the DOM LINK element and adds it to the document
     * @param url
     * @returns {DOM} LINK tag
     */
    __createLinkElement(url) {
      var node = document.createElement("link");
      node.setAttribute("type", "text/css");
      node.setAttribute("rel", "stylesheet");
      node.setAttribute("data-zx-utils-scriptloader-url", url);
      node.setAttribute("href", url);
      document.getElementsByTagName("head")[0].appendChild(node);
      return node;
    },

    debug(message) {
      qx.log.Logger.debug(this, message);
    }
  }
});
