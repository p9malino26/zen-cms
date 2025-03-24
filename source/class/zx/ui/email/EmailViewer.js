/* ************************************************************************
*
*  Zen [and the art of] CMS
*
*  https://zenesis.com
*
*  Copyright:
*    2019-2025 Zenesis Ltd, https://www.zenesis.com
*
*  License:
*    MIT (see LICENSE in project root)
*
*  Authors:
*    John Spackman (john.spackman@zenesis.com, @johnspackman)
*
* ************************************************************************ */

const protonMime = require("@protontech/jsmimeparser");

qx.Class.define("zx.ui.email.EmailViewer", {
  extend: qx.ui.container.Composite,

  construct() {
    super(new qx.ui.layout.VBox(2));
    this._add(this.getQxObject("grpHeaders"));
    this._add(this.getQxObject("tabview"), { flex: 1 });

    this.__attachmentUrls = new Map();
  },

  properties: {
    value: {
      check: "zx.server.email.Message",
      init: null,
      nullable: true,
      event: "changeValue",
      transform: "_transformValue",
      apply: "_applyValue"
    },

    bodyDisplayMode: {
      check: ["plain", "markup"],
      nullable: true,
      init: null,
      event: "changeBodyDisplayMode",
      apply: "_applyBodyDisplayMode"
    },

    currentAttachment: {
      nullable: true,
      init: null,
      event: "changeCurrentAttachment"
    }
  },

  objects: {
    tabview() {
      let tv = new qx.ui.tabview.TabView();
      tv.add(this.getQxObject("pageBody"));
      tv.add(this.getQxObject("pageAttachments"));
      return tv;
    },

    pageBody() {
      let page = new qx.ui.tabview.Page("Body");
      page.setLayout(new qx.ui.layout.Grow());
      let scroll = new qx.ui.container.Scroll();
      let scrollContents = new qx.ui.container.Composite(new qx.ui.layout.Grow());
      scroll.add(scrollContents);
      scrollContents.add(this.getQxObject("lblBodyPlainText"));
      scrollContents.add(this.getQxObject("htmlBody"));
      page.add(scroll);
      return page;
    },

    lblBodyPlainText() {
      return new qx.ui.basic.Label().set({ rich: true, wrap: true, padding: 10 });
    },

    htmlBody() {
      return new qx.ui.embed.Html().set({ overflowY: "scroll" });
    },

    grpHeaders() {
      let grp = new qx.ui.groupbox.GroupBox("Headers").set({ minWidth: 500 });
      let layout = new qx.ui.layout.Grid();
      layout.setColumnFlex(1, 1);
      grp.setLayout(layout);

      grp.add(new qx.ui.basic.Label("Date Queued:"), { row: 0, column: 0 });

      let comp2 = new qx.ui.container.Composite(new qx.ui.layout.HBox(2));
      comp2.add(this.getQxObject("edtDateQueued"));
      comp2.add(new qx.ui.basic.Label("Date Delivered: "));
      comp2.add(this.getQxObject("edtDateDelivered"));
      grp.add(comp2, { row: 0, column: 1 });

      grp.add(new qx.ui.basic.Label("To:"), { row: 1, column: 0 });
      grp.add(this.getQxObject("edtTo"), { row: 1, column: 1 });

      grp.add(new qx.ui.basic.Label("CC:"), { row: 2, column: 0 });
      grp.add(this.getQxObject("edtCc"), { row: 2, column: 1 });

      grp.add(new qx.ui.basic.Label("Subject:"), { row: 3, column: 0 });
      grp.add(this.getQxObject("edtSubject"), { row: 3, column: 1 });

      grp.add(new qx.ui.basic.Label("Display:"), { row: 4, column: 0 });

      let rg = new qx.ui.form.RadioGroup();
      rg.addListener("changeSelection", evt => this.setBodyDisplayMode(evt.getData()[0]?.getModel() ?? null));
      rg.add(this.getQxObject("btnShowMarkup"));
      rg.add(this.getQxObject("btnShowPlain"));

      let comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(2));
      comp.add(this.getQxObject("btnShowMarkup"));
      comp.add(this.getQxObject("btnShowPlain"));
      grp.add(comp, { row: 4, column: 1 });

      return grp;
    },

    edtDateQueued() {
      return new qx.ui.form.TextField().set({ readOnly: true });
    },
    edtDateDelivered() {
      return new qx.ui.form.TextField().set({ readOnly: true });
    },

    edtTo() {
      return new qx.ui.form.TextField().set({ readOnly: true });
    },
    edtCc() {
      return new qx.ui.form.TextField().set({ readOnly: true });
    },
    edtSubject() {
      return new qx.ui.form.TextField().set({ readOnly: true });
    },

    btnShowMarkup() {
      return new qx.ui.form.RadioButton("Markup").set({ minWidth: 100, model: "markup" });
    },

    btnShowPlain() {
      return new qx.ui.form.RadioButton("Plaintext").set({ minWidth: 100, model: "plain" });
    },

    pageAttachments() {
      let pg = new qx.ui.tabview.Page("Attachments");
      pg.setLayout(new qx.ui.layout.HBox(2));
      pg.add(this.getQxObject("lstAttachments"));
      pg.add(this.getQxObject("compAttachmentInfo"), { flex: 1 });
      return pg;
    },

    lstAttachments() {
      return new qx.ui.form.List().set({ minWidth: 300 });
    },

    ctlrAttachments() {
      let ctlr = new qx.data.controller.List(null, this.getQxObject("lstAttachments"), "name");
      ctlr.getSelection().addListener("change", () => {
        let attachment = ctlr.getSelection().getItem(0);
        this.setCurrentAttachment(attachment || null);
      });
      return ctlr;
    },

    compAttachmentInfo() {
      let layout = new qx.ui.layout.Grid(2, 2);
      layout.setColumnFlex(1, 1);
      let comp = new qx.ui.container.Composite(layout).set({ minWidth: 300 });

      comp.add(new qx.ui.basic.Label("Name:"), { row: 0, column: 0 });
      comp.add(this.getQxObject("edtName"), { row: 0, column: 1 });

      comp.add(new qx.ui.basic.Label("Type:"), { row: 1, column: 0 });
      comp.add(this.getQxObject("edtContentType"), { row: 1, column: 1 });

      comp.add(new qx.ui.basic.Label("Size:"), { row: 2, column: 0 });
      comp.add(this.getQxObject("edtSize"), { row: 2, column: 1 });

      comp.add(this.getQxObject("btnViewAttachment"), { row: 3, column: 0 });

      return comp;
    },

    edtName() {
      const edtName = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.name", edtName, "value");
      return edtName;
    },

    edtContentType() {
      const edtContentType = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.contentType", edtContentType, "value");
      return edtContentType;
    },

    edtSize() {
      const edtSize = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.size", edtSize, "value", { converter: this._size1024.bind(this) });
      return edtSize;
    },

    btnViewAttachment() {
      let btn = new qx.ui.form.Button("View").set({ maxWidth: 300 });
      btn.addListener("execute", () => window.open(this._createUrlForAttachment(this.getCurrentAttachment())));
      this.bind("currentAttachment", btn, "enabled", { converter: Boolean });
      return btn;
    }
  },

  members: {
    _transformValue(value) {
      if (value === null || value instanceof zx.server.email.Message) {
        return value;
      }
      if (typeof value === "string") {
        return zx.ui.email.EmailViewer.parseEmailMessage(value);
      }
      throw new Error(`Invalid value for virtual property 'value' of class ${this.classname}: ${JSON.stringify(value)} - expected nullable string or zx.server.email.Message`);
    },

    _applyValue(value, oldValue) {
      if (value) {
        this.getQxObject("lblBodyPlainText").setValue(value.getTextBody() || "");
        this.getQxObject("htmlBody").setHtml(`<div style="color:initial">${value.getHtmlBody() || ""}</div>`);
        this.setBodyDisplayMode(!!value.getHtmlBody() ? "markup" : "plain");
        let hasMarkup = !!value.getHtmlBody();
        let hasPlain = !!value.getTextBody();
        this.getQxObject("btnShowMarkup").set({
          enabled: hasMarkup,
          value: hasMarkup
        });
        this.getQxObject("btnShowPlain").set({
          enabled: hasPlain,
          value: hasPlain && !hasMarkup
        });
        this.getQxObject("ctlrAttachments").setModel(value.getAttachments());
        this.getQxObject("edtTo").setValue(value.getTo()?.join(", ") || "");
        this.getQxObject("edtCc").setValue(value.getCc()?.join(", ") || "");
        this.getQxObject("edtSubject").setValue(value.getSubject() || "");
        const DF = new qx.util.format.DateFormat("yyyy-MM-dd HH:mm");
        this.getQxObject("edtDateQueued").setValue(value.getDateQueued() ? DF.format(value.getDateQueued()) : "");
        this.getQxObject("edtDateDelivered").setValue(value.getDateDelivered() ? DF.format(value.getDateDelivered()) : "");
      } else {
        this.getQxObject("lblBodyPlainText").setValue("");
        this.getQxObject("htmlBody").setHtml("");
        this.getQxObject("ctlrAttachments").setModel(null);
        this.getQxObject("edtTo").setValue("");
        this.getQxObject("edtCc").setValue("");
        this.getQxObject("edtSubject").setValue("");
        this.getQxObject("edtDateQueued").setValue("");
        this.getQxObject("edtDateDelivered").setValue("");
      }
    },

    _applyBodyDisplayMode(value, oldValue) {
      this.__updateUi();
    },

    __updateUi() {
      let mode = this.getBodyDisplayMode();
      this.getQxObject("lblBodyPlainText").setVisibility(mode == "plain" ? "visible" : "excluded");
      this.getQxObject("htmlBody").setVisibility(mode != "plain" ? "visible" : "excluded");
    },

    __attachmentUrls: null,

    _createUrlForAttachment(attachment) {
      if (this.__attachmentUrls.has(attachment)) {
        return this.__attachmentUrls.get(attachment);
      }
      let url;
      if (attachment.getPath().startsWith("blob:")) {
        url = attachment.getPath();
      } else {
        url = new URL(attachment.getPath(), window.location.origin).href;
      }
      this.__attachmentUrls.set(attachment, url);
      return url;
    },

    _size1024(size) {
      if (size === null) {
        return "[unknown]";
      }
      const sizes = ["B", "KB", "MB", "GB"]; // there's no way you're loading a TB
      for (let i = 0; i < sizes.length; i++) {
        if (size < 1024) {
          return `${size} ${sizes[i]}`;
        }
        size = parseFloat((size / 1024).toFixed(1));
      }
      return null;
    }
  },

  statics: {
    /**
     * Parse a raw email message into a {@link zx.server.email.Message} object.
     *
     * @param {string} value - The raw email message to parse.
     * @returns {zx.server.email.Message} - The parsed email message.
     */
    parseEmailMessage(value) {
      if (value === null) {
        return null;
      }
      let parsed = protonMime.parseMail(value);

      const addressesFor = addrOrGrp => ("email" in addrOrGrp ? [addrOrGrp.email] : addrOrGrp.group.map(addr => addr.email));
      const inlineAssets = (html, attachments) => {
        if ((html ?? null) === null) {
          return null;
        }
        for (let attachment of attachments) {
          if (attachment.contentDisposition !== "inline") {
            continue;
          }
          if (attachment.contentId) {
            let url = URL.createObjectURL(new Blob([attachment.content], { type: attachment.contentType }));
            html = html.replace(new RegExp(`cid:${attachment.contentId.slice(1, -1)}`, "g"), url);
          }
        }
        return html;
      };

      return new zx.server.email.Message().set({
        dateQueued: new Date(-Infinity),
        lastErrorMessage: null,
        subject: parsed.subject ?? null,
        from: parsed.from?.email ?? null,
        dateDelivered: parsed.date ?? null,
        to: parsed.to?.flatMap(addressesFor) ?? null,
        cc: parsed.cc?.flatMap(addressesFor) ?? null,
        bcc: parsed.bcc?.flatMap(addressesFor) ?? null,
        htmlBody: inlineAssets(parsed.body.html, parsed.attachments),
        textBody: parsed.body.text ? qx.bom.String.escape(parsed.body.text).replace(/\n/g, "<br />") : null,
        attachments: new qx.data.Array(
          parsed.attachments.map(attachment =>
            new zx.server.email.Attachment().set({
              contentType: attachment.contentType,
              size: attachment.size,
              name: attachment?.rawHeaderText.match(/name="?(.+?)"?;/)[1],
              path: URL.createObjectURL(new Blob([attachment.content], { type: attachment.contentType }))
            })
          )
        )
      });
    }
  }
});
