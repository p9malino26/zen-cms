/**
 * A widget for uploading files. Contains a label with the file name, and upload and delete buttons
 */
qx.Class.define("zx.ui.files.FileUpload", {
  extend: qx.ui.core.Widget,
  implement: [zx.io.remote.IUploadCompleted],

  construct() {
    super();
    let layout = new qx.ui.layout.HBox(5).set({ alignY: "middle" });
    this._setLayout(layout);

    this._add(this._createChildControl("lbl"));
    this._add(this._createChildControl("btnUpload"));
    this._add(this._createChildControl("btnClear"));

    let mgr = qx.core.Init.getApplication().getZxUploadMgr();
    mgr.addListener("addFile", this.__onUploadMgrAddFile, this);
    mgr.addWidget(this.getChildControl("btnUpload"));

    this.getChildControl("btnClear").addListener("execute", () => {
      this.getValue().deleteFromDisk();
      this.setValue(null);
    });
  },

  destruct() {
    var mgr = qx.core.Init.getApplication().getZxUploadMgr();
    mgr.removeListener("addFile", this.__onUploadMgrAddFile, this);
    mgr.removeWidget(this.getChildControl("btnUpload"));
  },

  properties: {
    appearance: {
      init: "uploaded-file",
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
      this.getChildControl("btnClear").setVisibility(value ? "visible" : "excluded");
    },

    /**@override */
    _createChildControlImpl(id) {
      switch (id) {
        case "lbl": {
          let lbl = new qx.ui.basic.Label().set({ rich: true, wrap: false });
          lbl.getContentElement().setStyles(
            {
              overflow: "hidden",
              textOverflow: "ellipsis"
            },

            true
          );
          this.bind(
            "value.originalFilename",
            new zx.utils.Target(value => {
              lbl.setValue(value ? `<u>${value}</u>` : "No File");
              lbl.setEnabled(!!value);
              lbl.setCursor(!!value ? "pointer" : "default");
            })
          );

          lbl.addListener("click", this.__onDownloadClicked, this);
          return lbl;
        }
        case "btnUpload": {
          let btn = new com.zenesis.qx.upload.UploadButton("Browse", "@FontAwesome/upload/16").set({ show: "icon" });
          return btn;
        }
        case "btnClear": {
          let btn = new qx.ui.form.Button("Delete", "@FontAwesome/xmark/16").set({ visibility: "excluded", show: "icon" });
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
      if (this.getValue()) {
        this.getValue().deleteFromDisk();
      }
      this.setValue(value);
    },

    __onUploadMgrAddFile(evt) {
      var file = evt.getData();
      if (file.getUploadWidget() == this.getChildControl("btnUpload")) {
        qx.core.ObjectRegistry.register(this);
        file.setParam("sourceQxHashCode", this.toHashCode());
        file.setParam("targetUuid", this.getChildControl("btnUpload").getParam("target"));
      }
    },

    /**
     *
     * @param {zx.io.remote.IUploadReceiver} target
     */
    setTarget(target) {
      this.getChildControl("btnUpload").setParam("target", target.toUuid());
    },

    /**
     * Callback for when the download link is clicked
     */
    __onDownloadClicked(evt) {
      let url = this.getValue()?.getUrl();
      if (!url) return;
      else {
        window.open(url, "_blank");
      }
    }
  }
});
