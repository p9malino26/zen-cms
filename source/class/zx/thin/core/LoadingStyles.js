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
 * Provides a mechanism for loading styles to be added to things like Buttons, but without
 * hard coding the implementation into the button.  The implementation uses LoadAwesome
 * https://github.com/danielcardoso/load-awesome which is licensed under MIT.
 *
 * To use the LoadingStyles, you must first include the CSS for the animations you want to
 * apply in your theme; you can do this by adding all styles, EG:
 *
 *  @import "zx.cms:zx/thin/theme/load-awesome-1.1.0/_all-styles.scss";
 *
 * or you can add individual styles, eg for the ball-clip-rotate-multiple:
 *
 *  @import "zx.cms:zx/thin/theme/load-awesome-1.1.0/css/ball-clip-rotate-multiple.css";
 *
 * Import as many styles as you like, but all the styles are around 275kb.
 */
qx.Class.define("zx.thin.core.LoadingStyles", {
  extend: qx.core.Object,

  members: {
    createElement(style, size) {
      size = size || "small";
      const SIZE_MAP = {
        small: "la-sm",
        normal: "",
        "2x": "la-2x"
      };
      let sizeClass = SIZE_MAP[size] || "la-sm";
      return (
        <div className={"la-" + style + " " + sizeClass + " qx-loading"}>
          <div></div>
          <div></div>
        </div>
      );
    }
  },

  statics: {
    /** @type {Instance} the global instance */
    __instance: null,

    /**
     * Returns the global instance, creating a default one if necessary
     *
     * @return {LoadingStyles}
     */
    getInstance() {
      const LoadingStyles = zx.thin.core.LoadingStyles;
      if (!LoadingStyles.__instance) {
        LoadingStyles.__instance = new LoadingStyles();
      }
      return LoadingStyles.__instance;
    },

    /**
     * Allows the global instance to be set/changed; will output a warning if
     * replacing the instance (which can be suppressed if you set the instance
     * to null first).
     *
     * @param instance {LoadingStyles} the new instance
     */
    setInstance(instance) {
      const LoadingStyles = zx.thin.core.LoadingStyles;
      if (qx.core.Environment.get("qx.debug")) {
        if (LoadingStyles.__instance && instance) {
          qx.log.Logger.warn("Overwriting instance of LoadingStyles");
        }
      }
      LoadingStyles.__instance = instance;
    }
  }
});
