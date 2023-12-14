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

qx.Class.define("zx.thin.ui.basic.Image", {
  extend: qx.html.Element,

  construct() {
    super();
  },

  properties: {
    cssClass: {
      init: "qx-image",
      refine: true
    },

    /** Whether the source can be styled by CSS, ie to use a DIV and background-image rule instead of a IMG tag */
    stylableSource: {
      init: false,
      check: "Boolean",
      apply: "_applyStylableSource",
      event: "changeStylableSource"
    },

    source: {
      init: null,
      nullable: true,
      check: "String",
      apply: "_applySource"
    }
  },

  members: {
    _child: null,

    _applyStylableSource(value) {
      this._updateUi();
    },

    _applySource(value) {
      this._updateUi();
    },

    _useNodeImpl(domNode, htmlChildren) {
      this._connectDomNode(domNode);
      if (htmlChildren.length) {
        if (this._child) {
          this._child.useNode;
        }
        this._deleteChild();
        this.add(htmlChildren[0]);
        this._child = htmlChildren[0];
      }
    },

    _updateUi() {
      let source = this.getSource();

      if (!source) {
        this._deleteChild();
        this.hide();
      } else {
        let match = source.match(/^\@(\w+)\/([^\/]+)(\/(\d+))?$/i);
        if (match) {
          let fontName = match[1];
          let ligature = match[2];
          let fontSize = match[4];
          let child = this._getChild("span");
          child.removeAll();
          child.removeAllClasses();
          child.addClass("font-" + fontName);
          var charCode = qx.util.ResourceManager.getInstance().fromFontUriToCharCode(source);
          child.setText(String.fromCharCode(charCode));
          child.setStyles({
            display: "table-cell",
            textAlign: "center"
          });

          if (fontSize) {
            child.setStyles({
              fontSize: fontSize + "px"
            });
          }
        } else if (this.isStylableSource()) {
          let child = this._getChild("div");
          if (source) {
            child.setStyles({
              backgroundImage: "url(" + source + ")",
              backgroundPosition: "0 0",
              backgroundRepeat: "no-repeat"
            });
          } else {
            child.setStyles({
              backgroundImage: ""
            });
          }
        } else {
          let child = this._getChild("img");
          child.setSource(source);
        }
        this.show();
      }
    },

    _getChild(nodeName) {
      if (this._child) {
        if (nodeName != this._child.getNodeName().toLowerCase()) {
          this._deleteChild();
        }
      }
      if (!this._child) {
        this._child = new qx.html.Image(nodeName);
        this.add(this._child);
      }
      return this._child;
    },

    _deleteChild() {
      if (this._child) {
        this.remove(this._child);
        this._child = null;
      }
    }
  }
});
