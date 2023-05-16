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

qx.Class.define("zx.app.pages.PageEditor", {
  extend: zx.ui.editor.Editor,

  construct() {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.Grow());
    this._add(this.getQxObject("splitter"));
  },

  properties: {
    /**
     * Currently select piece; this can include the top level item, which is a `zx.cms.content.Page`, or
     * any child
     */
    currentPiece: {
      init: null,
      nullable: true,
      check: "zx.io.persistence.Object",
      event: "changeCurrentPiece",
      apply: "_applyCurrentPiece"
    }
  },

  members: {
    /** @type{Class<zx.ui.editor.Editor>} the current mini editor class */
    __miniEditorClass: null,

    /** @type{zx.ui.editor.Editor} the current mini editor instance */
    __miniEditor: null,

    /** @type{zx.io.remote.NetworkController} controller for communication with embedded window, created on demand */
    __windowIoController: null,

    /**
     * Called by `LiveEditProxy` when the thin client edits content
     */
    liveEdited(pieceUuid, propertyName, value) {
      if (this.__miniEditor) {
        this.__miniEditor.liveEdited(propertyName, value);
      } else {
        this.warn("Piece live edited but no editor available to handle it: uuid=" + pieceUuid + ", value=" + value);
      }
    },

    /**
     * Event handler for "propertyChanged" event on the current mini editor
     *
     * @param {qx.event.type.Data} evt
     */
    __onEditorPropertyChanged(evt) {
      let { propertyName, value, oldValue } = evt.getData();
      let proxy = this.__windowIoController.getUriMapping("zx.thin.ThinClientApp.remoteControlProxy");
      if (proxy) {
        proxy.propertyChanged(this.getCurrentPiece().toUuid(), propertyName, value, oldValue);
      } else {
        this.warn("Editor property changed but there is no remote control proxy to apply it");
      }
    },

    /**
     * @Override
     */
    _applyValue(value, oldValue) {
      const addNode = (parentNode, piece) => {
        var node;
        if (piece instanceof zx.cms.content.ContainerPiece || piece instanceof zx.cms.content.Page) {
          node = new qx.ui.tree.TreeFolder(piece.describeForLayoutTree()).set({
            icon: "@FontAwesome/folder/16"
          });
          piece.getPieces().forEach(piece => addNode(node, piece));
        } else {
          node = new qx.ui.tree.TreeFile(piece.describeForLayoutTree()).set({
            icon: "@FontAwesome/file-alt/16"
          });
        }
        node.setModel(piece);
        if (parentNode) parentNode.add(node);
        node.setOpen(true);
        return node;
      };
      const clearNode = node => {
        while (node.getChildren().length) {
          let childNode = node.getChildren()[0];
          clearNode(childNode);
          node.remove(childNode);
          childNode.dispose();
        }
      };
      const disposeNode = node => {
        clearNode(node);
        node.dispose();
      };

      let tree = this.getQxObject("treeLayout");

      if (oldValue) {
        let rootNode = tree.getRoot();
        if (rootNode) {
          tree.setRoot(null);
          disposeNode(rootNode);
        }
      }
      let iframe = this.getQxObject("iframe");
      if (value) {
        if (!this.__windowIoController) {
          // Controller manages the objects and their serialisation
          this.__windowIoController = new zx.io.remote.NetworkController();

          // Listener is specific to a given platform (postMessage, Xhr, etc)
          new zx.io.remote.WindowListener(this.__windowIoController);

          let proxy = new zx.app.pages.LiveEditProxy(this);
          this.__windowIoController.putUriMapping("zx.app.pages.PageEditor.liveEditProxy", proxy);
        }

        let rootNode = addNode(null, value);
        tree.setRoot(rootNode);
        rootNode.setOpen(true);
        let url = value.getUrl().substring(5) + ".html";
        iframe.setSource(url);
      } else {
        iframe.setSource("about:blank");
      }
    },

    /**
     * Apply for `currentPiece`
     */
    async _applyCurrentPiece(value, oldValue) {
      const createEditor = async () => {
        if (this.__miniEditorClass) {
          let ed = (this.__miniEditor = new this.__miniEditorClass());
          ed.setMasterValueAccessor(this);
          this.getQxObject("compMiniEditor").add(ed);
          ed.addListener("propertyChanged", this.__onEditorPropertyChanged, this);
          await ed.setValue(value);
        }
      };

      const disposeEditor = async () => {
        if (this.__miniEditor) {
          let ed = this.__miniEditor;
          this.__miniEditor = null;
          await ed.setValue(null);
          ed.removeListener("propertyChanged", this.__onEditorPropertyChanged, this);
          this.getQxObject("compMiniEditor").remove(ed);
          ed.dispose();
        }
      };

      if (value) {
        let editorClass = value.getMiniEditorClass();
        if (editorClass != this.__miniEditorClass) await disposeEditor();
        this.__miniEditorClass = editorClass;
        if (editorClass) {
          if (!this.__miniEditor) await createEditor();
          else await this.__miniEditor.setValue(value);
        }
      } else {
        await disposeEditor();
      }
    },

    /**
     * @Override
     */
    _createQxObjectImpl(id) {
      switch (id) {
        case "splitter":
          var pane = new qx.ui.splitpane.Pane("horizontal");
          pane.add(this.getQxObject("compProperties"), 0);
          pane.add(this.getQxObject("compView"), 1);
          return pane;

        case "compProperties":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          comp.add(this.getQxObject("treeLayout"), { flex: 1 });
          comp.add(this.getQxObject("compMiniEditor"), { flex: 1 });
          return comp;

        case "treeLayout":
          var tree = new qx.ui.tree.Tree().set({ minWidth: 300 });
          tree.addListener("changeSelection", evt => {
            let node = evt.getData()[0];
            let piece = (node && node.getModel()) || null;
            this.setCurrentPiece(piece);
          });
          return tree;

        case "compMiniEditor":
          return new qx.ui.container.Composite(new qx.ui.layout.Grow());

        case "compView":
          var comp = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          comp.add(this.getQxObject("toolbar"));
          comp.add(this.getQxObject("iframe"), { flex: 1 });
          return comp;

        case "toolbar":
          var tb = new qx.ui.toolbar.ToolBar();
          tb.add(this.getQxObject("btnRefresh"));
          return tb;

        case "btnRefresh":
          var btn = new qx.ui.toolbar.Button("Refresh", "@FontAwesomeSolid/redo/16");
          btn.addListener("execute", () => {
            let iframe = this.getQxObject("iframe");
            let url = iframe.getSource();
            iframe.setSource("about:blank");
            setTimeout(() => iframe.setSource(url), 50);
          });
          return btn;

        case "iframe":
          return new qx.ui.embed.Iframe("about:blank");
      }

      return this.base(arguments, id);
    }
  }
});
