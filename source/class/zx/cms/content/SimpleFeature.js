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
 * A SimpleFeature is a simple Feature which always renders the qx.html.Element on the
 * server and also the client
 */
qx.Class.define("zx.cms.content.SimpleFeature", {
  extend: qx.core.Object,
  implement: [zx.cms.content.IFeature],

  /**
   * Constructor
   *
   * @param targetClass {Class} the class that this feature is for
   */
  construct(targetClass) {
    super();
    this._targetClass = targetClass;
    this._anno = qx.Annotation.getClass(targetClass, zx.cms.content.anno.Feature)[0] || null;

    this._serverRenderClass = null;
    this._supportsServerRender = null;
    this._clientInstallerClassname = null;
    if (this._anno) {
      this._supportsServerRender = this._anno.isSupportsServerRender();
      if (this._anno.getServerRender()) {
        this._serverRenderClass = qx.Class.getByName(this._anno.getServerRender());

        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue(!!this._serverRenderClass && qx.Class.hasInterface(this._serverRenderClass, zx.cms.content.IFeatureServerRender));
        }
      }
      if (this._anno.getClientInstaller()) {
        this._clientInstallerClassname = this._anno.getClientInstaller();
      }
    }

    if (!this._serverRenderClass && qx.Class.hasInterface(this._targetClass, zx.cms.content.IFeatureServerRender)) {
      this._serverRenderClass = this._targetClass;
    }
    if (this._supportsServerRender === null) {
      this._supportsServerRender = !!this._serverRenderClass || qx.Class.isSubClassOf(this._targetClass, qx.html.Element);
    }
    if (this._supportsServerRender && !this._serverRenderClass && !qx.Class.isSubClassOf(this._targetClass, qx.html.Element)) {
      this.error(`Cannot determine zx.cms.content.IFeatureServerRender instance to use to render ${this._targetClass.classname}`);
    }

    if (!this._clientInstallerClassname && qx.Class.hasInterface(this._targetClass, zx.cms.content.IFeatureClientInstaller)) {
      this._clientInstallerClassname = this._targetClass.classname;
    }
    if (!this._clientInstallerClassname) {
      this._clientInstallerClassnamename = "zx.thin.core.FeatureClientInstaller";
    }
  },

  members: {
    /** @type {Class} the class that this feature is for */
    _targetClass: null,

    /** @type{Boolean} whether server rendering is supported */
    _supportsServerRender: null,

    /** @type{Class?} the class used to render on the server */
    _serverRenderClass: null,

    /** @type{qx.core.Object?} the instance of `_serverRenderClass` used to render (created on first use and cached) */
    _serverRenderObj: null,

    /** @type{String} the class used to render on the client */
    _clientInstallerClassname: null,

    /** @type {anno.Feature} the annotation that guides this feature */
    _anno: null,

    /**
     * @Override
     */
    async prepareContext(context, rendering, options) {
      if (!this._supportsServerRender) {
        return;
      }

      if (!this._serverRenderObj && this._serverRenderClass) {
        this._serverRenderObj = new this._serverRenderClass();
      }

      if (this._serverRenderObj) {
        return await this._serverRenderObj.prepareContext(context, rendering, options);
      }

      let element = new this._targetClass();
      if (qx.Class.hasInterface(element.constructor, zx.cms.content.IFeatureServerLifecycle)) {
        await element.prepareContext(context, rendering, options);
      }
      context._element = element;
    },

    /**
     * @Override
     */
    renderServer(context, rendering, options) {
      if (!this._supportsServerRender) {
        return "";
      }

      if (this._serverRenderObj) {
        return this._serverRenderObj.renderServer(this._targetClass, context, rendering, options);
      }

      return (context._element && context._element.serialize()) || "";
    },

    /**
     * @Override
     */
    renderClientInstall(rendering, options) {
      let useDom = !this._anno || !!this._anno.isSupportsServerRender();

      if (!this._serverRenderObj && this._serverRenderClass) {
        this._serverRenderObj = new this._serverRenderClass();
      }

      if (this._serverRenderObj) {
        let result = this._serverRenderObj.renderClientInstall(this._clientInstallerClassname, options);

        if (result !== null && result !== undefined) {
          return result;
        }
      }

      let config = {
        useDom: useDom,
        targetClassname: this._targetClass.classname,
        clientInstallerClassname: this._clientInstallerClassname,
        options: options
      };

      return `zx.thin.core.FeatureClientInstaller.installPiece(piece, ${JSON.stringify(config, null, 2)});\n`;
    }
  }
});
