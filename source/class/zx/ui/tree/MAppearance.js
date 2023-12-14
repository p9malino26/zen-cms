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

qx.Theme.define("zx.ui.tree.MAppearance", {
  appearances: {
    "zx-ui-tree": {
      style(states) {
        return {};
      }
    },

    "zx-ui-tree-row": {
      style(states) {
        return {
          textColor: states.selected ? "table-row-background-selected" : undefined
        };
      }
    },

    "zx-ui-tree-row/column-widget": "atom",

    "zx-ui-tree-row/arrow": {
      alias: "image",
      style(states) {
        var icon;
        if (!states.hasChildren) {
          icon = "file";
        } else icon = states.opened ? "folder-open" : "folder";
        if (states.selected) {
          icon = "@FontAwesome/" + icon;
        } else icon = "@FontAwesomeSolid/" + icon;
        return {
          source: icon + "/16"
        };
      }
    },

    "zx-ui-tree-row/content/label": {
      style(states) {
        return {
          textColor: "text-on-surface",
          padding: [2, 0, 0, 2]
        };
      }
    },

    "zx-ui-tree-row/content/icon": "image",

    "zx-ui-tree-dropcaret": {
      alias: "zx-ui-tree-row",
      style(states) {
        return {
          opacity: 0.5
        };
      }
    },

    "tree-column-rowwidget": {
      alias: "atom",

      style(states) {
        return {};
      }
    },

    /*
    "tree-column-header": {
    alias: "atom"
    },
    */

    "tree-column-cell": {
      alias: "atom",

      style(states) {
        var decorator;
        return {
          padding: [3, 0, 2, 0],
          textColor: states.disabled ? "text-disabled" : states.selected ? "text-on-surface" : "text-on-primary"
        };
      }
    }
  }
});
