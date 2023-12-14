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

qx.Theme.define("zx.cms.client.theme.tangible.Decoration", {
  extend: qx.theme.tangible.Decoration,

  include: [zx.ui.tree.MDecoration],

  decorations: {
    /** Decoration for text fields */
    "material-textfield": {
      style: {
        style: "solid",
        width: 1,
        color: "primary-alpha-10"
      }
    },

    "material-textfield-disabled": {
      style: {
        style: "solid",
        width: 1,
        color: "primary-disabled-alpha-20"
      }
    },

    /** Border is used for framebox, which is for things like lists */
    border: {
      style: {
        style: "solid",
        width: 1,
        color: "primary-alpha-10"
      }
    },

    "border-disabled": {
      style: {
        style: "solid",
        width: 1,
        color: "primary-disabled-alpha-20"
      }
    },

    "toolbar-button": {
      include: "material-button",
      style: {
        color: "primary-alpha-30",
        width: 1,
        shadowHorizontalLength: 0,
        shadowVerticalLength: 0,
        shadowBlurRadius: 0,
        shadowSpreadRadius: 0
      }
    },

    "toolbar-button-hovered": {
      include: "material-button-hovered",
      style: {
        color: "primary-alpha-30",
        width: 1
      }
    },

    "toolbar-button-left": {
      include: "toolbar-button",
      style: {
        radius: [2, 0, 0, 2]
      }
    },

    "toolbar-button-hovered-left": {
      include: "toolbar-button-hovered",
      style: {
        radius: [2, 0, 0, 2]
      }
    },

    "toolbar-button-right": {
      include: "toolbar-button",
      style: {
        radius: [0, 2, 2, 0]
      }
    },

    "toolbar-button-hovered-right": {
      include: "toolbar-button-hovered",
      style: {
        radius: [0, 2, 2, 0]
      }
    },

    error: {
      style: {
        width: 4,
        color: "red",
        style: "solid"
      }
    },

    splitpane: {
      style: {
        width: 0
      }
    },

    progress: {
      decorator: [qx.ui.decoration.MBoxShadow, qx.ui.decoration.MBorderRadius, qx.ui.decoration.MSingleBorder],

      style: {
        radius: 4,
        width: 1,
        color: "border-main",
        shadowColor: "input-shadow",
        shadowLength: 0,
        shadowBlurRadius: 20
      }
    }
  }
});
