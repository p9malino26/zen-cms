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
 * Loads an image from a URL, and provides a promise which
 * resolves when it has loaded.
 *
 */
qx.Class.define("zx.thin.util.ImageLoader", {
  extend: qx.core.Object,

  /**
   * Downloads from the URL
   *
   * @param url {String} the url to download from
   */
  construct(url) {
    super();
    this.loadCount = 0;

    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    var image;
    if (url instanceof Image) {
      this.__url = null;
      image = this.__image = new Image();
      if (!image.complete) {
        image.onload = () => this._onLoad();
        image.onerror = () => this._onError();
        image.onabort = () => this._onError();
      } else {
        this._promise._resolve();
      }
    } else {
      this.__url = url;
      image = this.__image = new Image();

      image.onload = () => this._onLoad();
      image.onerror = () => this._onError();
      image.onabort = () => this._onError();
      image.src = url;
    }
  },

  properties: {
    /** True when the image is loaded */
    loaded: {
      init: false,
      check: "Boolean",
      event: "changeLoaded"
    }
  },

  members: {
    /** @type{String} The URL to download from */
    __url: null,

    /* @type{Image} The DOM Image */
    __image: null,

    /* @type{Integer?} the width of the loaded image */
    __width: 0,

    /* @type{Integer?} the height of the loaded image */
    __height: 0,

    /**
     * Event handler for the DOM onload event
     */
    _onLoad() {
      var image = this.__image;
      var stats = zx.thin.util.ImageLoader;

      if (!image.height || !image.width) {
        console.error("Image loaded but not ready, height=" + image.height + ", width=" + image.width + ", loadCount=" + this.loadCount + ", url=" + this.__url);

        this.loadCount++;
        if (this.loadCount < 10) {
          setTimeout(() => this._onLoad(), 100);
          return;
        }
        stats.invalid++;
      } else {
        this.__width = image.width;
        this.__height = image.height;
        stats.success++;
      }
      this._unbindEvents();
      this._resolve(image);
      this.setLoaded(true);
    },

    /**
     * Event handler for the DOM error events
     */
    _onError() {
      zx.thin.util.ImageLoader.stats.error++;
      console.error("Image failed to load, url=" + this.__url);
      this._unbindEvents();
      this._reject();
    },

    /**
     * Returns the URL
     *
     * @return {String} the URL
     */
    getUrl() {
      return this.__url;
    },

    /**
     * Returns the DOM Image
     *
     * @return {Image} the Image
     */
    getImage() {
      return this.__image;
    },

    /**
     * Returns the width of the image, if it is loaded
     *
     * @return {Integer?} the width, or null if not loaded
     */
    getWidth() {
      return this.__width;
    },

    /**
     * Returns the height of the image, if it is loaded
     *
     * @return {Integer?} the height, or null if not loaded
     */
    getHeight() {
      return this.__height;
    },

    /**
     * Returns a promise that resolves when the image loads, and rejects if it fails to load
     *
     * @return {qx.Promise} the promise
     */
    promise() {
      return this._promise;
    },

    /**
     * Helper method to unbind DOM event handlers
     */
    _unbindEvents() {
      this.__image.onload = null;
      this.__image.onerror = null;
      this.__image.onabort = null;
    }
  },

  statics: {
    /** Statistics */
    stats: {
      success: 0,
      invalid: 0,
      error: 0
    },

    /** @type{Map<String, ImageLoader>} List of ImageLoader instances mapped by URL */
    __loaders: {},

    /**
     * Returns a single ImageLoader instance for a URL, creating and caching an ImageLoader
     * instance if necessary
     *
     * @param url {String} the URL
     * @return {ImageLoader}
     */
    getLoader(url) {
      var ImageLoader = zx.thin.util.ImageLoader;
      var loader = ImageLoader.__loaders[url];
      if (!loader) {
        loader = ImageLoader.__loaders[url] = new ImageLoader(url);
      }
      return loader;
    }
  }
});
