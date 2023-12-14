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

qx.Theme.define("zx.cms.client.theme.tangible.Appearance", {
  extend: qx.theme.tangible.Appearance,

  include: [zx.ui.editor.MAppearance, zx.ui.tree.MAppearance],

  appearances: {
    inlinebutton: {
      alias: "button",

      style(states) {
        return {
          padding: 2,
          margin: 0
        };
      }
    },

    "inlinebutton/icon": {
      alias: "image",
      include: "image",
      style(states) {
        return {
          textColor: states.disabled ? "text-disabled-on-surface" : "text-primary-on-surface"
        };
      }
    },

    label: {
      style(states) {
        return {
          textColor: states.disabled ? "text-disabled-on-surface" : undefined,
          padding: [3, 0, 4, 0]
        };
      }
    },

    "datefield/cboHours": "combobox",
    "datefield/cboMinutes": "combobox",
    "datefield/edtSeconds": "textfield",

    pickbox: {
      alias: "selectbox",
      include: "selectbox",
      style(states) {
        return { padding: 0, margin: 0 };
      }
    },

    "pickbox/label": "widget",
    "pickbox/pick": {
      alias: "inlinebutton",
      include: "inlinebutton",

      style(states) {
        return {
          backgroundColor: undefined,
          icon: qx.theme.tangible.Image.URLS["arrow-down"]
        };
      }
    },

    tabview: {
      base: true,
      include: "framebox"
    },

    "tabview/bar": {
      base: true,
      style(states) {
        return {
          backgroundColor: "primary-alpha-5"
        };
      }
    },

    "window/captionbar": {
      base: true,
      style(states) {
        return {
          backgroundColor: states.active ? "primary-selected" : "primary-inactive"
        };
      }
    },

    toolbar: {
      base: true,
      style(states) {
        return {
          backgroundColor: "primary-alpha-5",
          padding: [7, 3]
        };
      }
    },

    "toolbar-button": {
      base: true,
      style(states) {
        return {
          backgroundColor: "surface",
          textColor: "text-on-surface",
          margin: [1, 2]
        };
      }
    },

    "splitbutton/button": {
      base: true,
      style(states) {
        var decorator = "toolbar-button";

        if (!states.disabled) {
          if (states.hovered) {
            decorator += "-hovered";
          }
        } else {
          decorator += "-disabled";
        }

        var decorator = "toolbar-button";
        if (states.hovered || states.pressed || states.checked) {
          decorator += "-hovered";
        }
        decorator += "-left";

        return {
          padding: [3, 5],
          margin: [1, 0, 1, 2],
          decorator: decorator,
          backgroundColor: "surface",
          textColor: "text-on-surface"
        };
      }
    },

    "splitbutton/arrow": {
      base: true,
      style(states) {
        var decorator = "toolbar-button";

        if (!states.disabled) {
          if (states.hovered) {
            decorator += "-hovered";
          }
        } else {
          decorator += "-disabled";
        }

        decorator += "-right";
        return {
          padding: [3, 5],
          margin: [1, 2, 1, 0],
          decorator: decorator,
          backgroundColor: "surface",
          textColor: "text-on-surface"
        };
      }
    },

    "splitbutton/arrow/icon": {
      style(states) {
        return {
          textColor: "text-on-surface"
        };
      }
    },

    "menu-button/icon": {
      base: true,
      style(states) {
        return {
          textColor: states.selected ? "text-on-primary" : "text-on-surface"
        };
      }
    },

    "form-renderer-label": {
      base: true,
      style() {
        return {
          paddingTop: 4
        };
      }
    },

    "material-textfield": {
      base: true,
      style(states) {
        var padding = [3, 1, 4, 1];
        if (states.readonly) {
          padding = [3, 1, 5, 1];
        } else if (states.focused) {
          padding = [3, 1, 3, 1];
        }
        return {
          backgroundColor: "surface",
          padding: padding,
          font: states.showingPlaceholder ? "italic" : "default"
        };
      }
    },

    searchfield: {
      include: "textfield",
      style(states, style) {
        style = qx.lang.Object.clone(style);
        style.padding = 0;
        style.margin = 0;
        return style;
      }
    },

    "searchfield/field": {
      style(states, style) {
        return {
          padding: 0,
          margin: 2
        };
      }
    },

    "searchfield/btnSearch": "inlinebutton"
  }
});
