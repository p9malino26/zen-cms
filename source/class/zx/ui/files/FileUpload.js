/**
 * A widget for uploading files. Contains a label with the file name, and upload and delete buttons
 */
qx.Class.define("zx.ui.files.FileUpload", {
  extend: qx.ui.core.Widget,
  implement: [zx.io.remote.IUploadCompleted],

  construct() {
    super();
    const layout = new qx.ui.layout.HBox().set({alignY: "middle"});
    this._setLayout(layout);

    this._add(this._createChildControl("lbl"));
    this._add(this._createChildControl("btn-upload"));
    this._add(this._createChildControl("btn-delete"));

    let mgr = qx.core.Init.getApplication().getZxUploadMgr();
    mgr.addListener("addFile", this.__onUploadMgrAddFile, this);
    mgr.addWidget(this.getChildControl("btn-upload"));

    this.getChildControl("btn-delete").addListener("execute", () => {
      this.setValue(null);
    });
  },

  destruct() {
    var mgr = qx.core.Init.getApplication().getZxUploadMgr();
    mgr.removeListener("addFile", this.__onUploadMgrAddFile, this);
    mgr.removeWidget(this.getChildControl("btn-upload"));
  },

  properties: {
    appearance: {
      init: "file-upload",
      refine: true
    },
    value: {
      init: null,
      nullable: true,
      check: "zx.server.files.DataFile",
      event: "changeValue",
      apply: "_applyValue"
    }
  },

  members: {
    _applyValue(value, oldValue) {
      oldValue?.deleteFromDisk();

      this.getChildControl("btn-delete").setVisibility(value ? "visible" : "excluded");
    },

    /**@override */
    _createChildControlImpl(id) {
      switch (id) {
        case "lbl": {
          let lbl = new qx.ui.basic.Label();
          this.bind("value.originalFilename", lbl, "value");
          return lbl;
        }
        case "btn-upload": {
          let btn = new com.zenesis.qx.upload.UploadButton("Browse", "@FontAwesome/upload/16");
          return btn;
        }
        case "btn-delete": {
          let btn = new qx.ui.form.Button("Delete", "@FontAwesome/xmark/16").set({ visibility: "excluded" });
          return btn;
        }
      }
      return super._createChildControlImpl(id);
    },

    /**
     * @override
     * @param {zx.server.files.DataFile} value
     */
    onUploadCompleted(value) {
      this.setValue(value);
    },

    __onUploadMgrAddFile(evt) {
      var file = evt.getData();
      if (file.getUploadWidget() == this.getChildControl("btn-upload")) {
        qx.core.ObjectRegistry.register(this);
        file.setParam("sourceQxHashCode", this.toHashCode());
        file.setParam("targetUuid", this.getChildControl("btn-upload").getParam("target"));
      }
    },

    /**
     *
     * @param {zx.io.remote.IUploadReceiver} target
     */
    setTarget(target) {
      this.getChildControl("btn-upload").setParam("target", target.toUuid());
    }
  }
});
