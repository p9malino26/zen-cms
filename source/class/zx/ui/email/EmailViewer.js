const protonMime = require("@protontech/jsmimeparser");

qx.Class.define("zx.ui.email.EmailViewer", {
  extend: qx.ui.container.Composite,

  construct() {
    super(new qx.ui.layout.VBox(10));
    this._add(this.getQxObject("root"), { flex: 1 });

    this.__attachmentUrls = new Map();

    this.bind("rawEmail", this, "parsedEmail", { converter: this._toServerEmailMessage.bind(this) });
    this.bind("parsedEmail", this, "bodyDisplayMode", {
      converter: () => {
        let hasMarkup = this.hasMarkup();
        let hasPlain = this.hasPlain();
        let current = this.getBodyDisplayMode();
        if (current && hasMarkup && hasPlain) {
          return current;
        }
        if (hasMarkup) {
          return "markup";
        }
        if (hasPlain) {
          return "plain";
        }
        return null;
      }
    });
  },

  properties: {
    /**
     * Raw email - either some {@link zx.server.email.Message}, or a `string` containing a raw
     * mime-encoded email.
     */
    rawEmail: {
      check: value => typeof value === "string",
      nullable: true,
      init: null,
      event: "changeRawEmail"
    },

    parsedEmail: {
      check: "zx.server.email.Message",
      nullable: true,
      init: null,
      event: "changeParsedEmail"
    },

    bodyDisplayMode: {
      check: ["plain", "markup"],
      nullable: true,
      init: null,
      event: "changeBodyDisplayMode"
    },

    currentAttachment: {
      nullable: true,
      init: null,
      event: "changeCurrentAttachment"
    }
  },

  objects: {
    root() {
      const root = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
      root.add(this.getQxObject("compMeta"));
      root.add(this.getQxObject("compBody"), { flex: 1 });
      return root;
    },

    // START(meta)
    compMeta() {
      const compMeta = new qx.ui.container.Composite(new qx.ui.layout.HBox(10)).set({ padding: 4 });
      compMeta.add(this.getQxObject("grpFields"));
      compMeta.add(this.getQxObject("grpAttachments"));
      return compMeta;
    },

    // START(fields)
    compFields() {
      const compFields = new qx.ui.container.Composite(new qx.ui.layout.VBox(10)).set({ width: 300 });
      compFields.add(this.getQxObject("fieldDate"));
      compFields.add(this.getQxObject("fieldFrom"));
      compFields.add(this.getQxObject("fieldSubject"));
      return compFields;
    },

    grpFields() {
      const grpFields = new qx.ui.groupbox.GroupBox("Headers").set({ minWidth: 500 });
      grpFields.setLayout(new qx.ui.layout.VBox(10));

      let comp; // nice to have: a grid layout with directional flex
      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Date:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldDate"), { flex: 1 });
      grpFields.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("From:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldFrom"), { flex: 1 });
      grpFields.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Subject:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldSubject"), { flex: 1 });
      grpFields.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Display:").set({ minWidth: 50 }));
      let group = new qx.ui.form.RadioGroup();
      group.addListener("changeSelection", evt => this.setBodyDisplayMode(evt.getData()[0]?.getModel() ?? null));
      group.add(this.getQxObject("radioShowMarkup"));
      comp.add(this.getQxObject("radioShowMarkup"), { flex: 1 });
      group.add(this.getQxObject("radioShowPlain"));
      comp.add(this.getQxObject("radioShowPlain"), { flex: 1 });
      grpFields.add(comp);

      return grpFields;
    },

    fieldDate() {
      const fieldDate = new qx.ui.form.DateField().set({ enabled: false });
      this.bind("parsedEmail.dateDelivered", fieldDate, "value");
      fieldDate.getChildControl("button").setVisibility("excluded");
      return fieldDate;
    },

    fieldFrom() {
      const fieldFrom = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("parsedEmail.from", fieldFrom, "value");
      return fieldFrom;
    },

    fieldSubject() {
      const fieldSubject = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("parsedEmail.subject", fieldSubject, "value");
      return fieldSubject;
    },

    radioShowMarkup() {
      const radioShowMarkup = new qx.ui.form.RadioButton("Markup").set({ minWidth: 100 });
      this.bind("parsedEmail", radioShowMarkup, "enabled", { converter: () => this.hasMarkup() });
      radioShowMarkup.setModel("markup");
      return radioShowMarkup;
    },

    radioShowPlain() {
      const radioShowPlain = new qx.ui.form.RadioButton("Plaintext").set({ minWidth: 100 });
      this.bind("parsedEmail", radioShowPlain, "enabled", { converter: () => this.hasPlain() });
      radioShowPlain.setModel("plain");
      return radioShowPlain;
    },
    // END(fields)

    // START(attachments)
    grpAttachments() {
      const grpAttachments = new qx.ui.groupbox.GroupBox("Attachments").set({ minWidth: 300 });
      grpAttachments.setLayout(new qx.ui.layout.HBox(10));
      grpAttachments.add(this.getQxObject("lstAttachments"));
      grpAttachments.add(this.getQxObject("compAttachmentInfo"));
      return grpAttachments;
    },

    lstAttachments() {
      const lstAttachments = new qx.ui.form.List().set({ minWidth: 300 });
      this.bind(
        "parsedEmail.attachments",
        new zx.utils.Target(attachments => {
          lstAttachments.removeAll();
          this.setCurrentAttachment(null);
          if (!attachments) {
            return;
          }
          for (let attachment of attachments) {
            let title = attachment.getName();
            let item = new qx.ui.form.ListItem(title, null, attachment);
            item.setToolTipText(title);
            lstAttachments.add(item);
            item.addListener("tap", () => this.setCurrentAttachment(attachment));
          }
        })
      );
      return lstAttachments;
    },

    compAttachmentInfo() {
      const compAttachmentInfo = new qx.ui.container.Composite(new qx.ui.layout.VBox(10)).set({ minWidth: 300 });
      let comp; // nice to have: a grid layout with directional flex

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Name:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldName"), { flex: 1 });
      compAttachmentInfo.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Type:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldType"), { flex: 1 });
      compAttachmentInfo.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(new qx.ui.basic.Label("Size:").set({ minWidth: 50 }));
      comp.add(this.getQxObject("fieldSize"), { flex: 1 });
      compAttachmentInfo.add(comp);

      comp = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
      comp.add(this.getQxObject("btnView"), { flex: 1 });
      compAttachmentInfo.add(comp);
      return compAttachmentInfo;
    },

    fieldName() {
      const fieldName = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.name", fieldName, "value");
      return fieldName;
    },

    fieldType() {
      const fieldType = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.contentType", fieldType, "value");
      return fieldType;
    },

    fieldSize() {
      const fieldSize = new qx.ui.form.TextField().set({ enabled: false });
      this.bind("currentAttachment.size", fieldSize, "value", { converter: this._size1024.bind(this) });
      return fieldSize;
    },

    btnView() {
      const btnView = new qx.ui.form.Button("View").set({ maxWidth: 300 });
      btnView.addListener("execute", () => window.open(this._createUrlForAttachment(this.getCurrentAttachment())));
      this.bind("currentAttachment", btnView, "enabled", { converter: Boolean });
      return btnView;
    },
    // END(attachments)

    // END(meta)

    // START(body)
    compBody() {
      const compBody = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      compBody.add(this.getQxObject("plaintextBody"), { flex: 1 });
      compBody.add(this.getQxObject("markupBody"), { flex: 1 });
      return compBody;
    },

    plaintextBody() {
      const plaintextBody = new qx.ui.container.Scroll();
      let plaintextLabel = new qx.ui.basic.Label().set({ rich: true, wrap: true, padding: 10 });
      plaintextBody.add(plaintextLabel);
      this.bind("parsedEmail", plaintextLabel, "value", { converter: parsed => parsed?.getTextBody() ?? "" });
      this.bind("bodyDisplayMode", plaintextBody, "visibility", { converter: mode => (mode === "plain" ? "visible" : "excluded") });
      return plaintextBody;
    },

    markupBody() {
      const markupBody = new qx.ui.embed.Html().set({ overflowY: "scroll" });
      this.bind("parsedEmail", markupBody, "html", { converter: parsed => `<div style="color:initial">${parsed?.getHtmlBody() ?? ""}</div>` });
      this.bind("bodyDisplayMode", markupBody, "visibility", { converter: mode => (mode === "markup" ? "visible" : "excluded") });
      return markupBody;
    }
    // END(body)
  },

  members: {
    setValue(value) {
      if (value instanceof zx.server.email.Message) {
        this.setParsedEmail(value);
        this.setRawEmail(null);
        return;
      }
      if (typeof value === "string") {
        this.setRawEmail(value);
        this.setParsedEmail(null);
        return;
      }
      if (value === null) {
        this.setRawEmail(null);
        this.setParsedEmail(null);
        return;
      }
      throw new Error(`Invalid value for virtual property 'value' of class ${this.classname}: ${JSON.stringify(value)} - expected nullable string or zx.server.email.Message`);
    },

    getValue() {
      return this.getRawEmail() ?? this.getParsedEmail();
    },

    resetValue() {
      this.resetRawEmail();
      this.resetParsedEmail();
    },

    __attachmentUrls: null,

    hasMarkup() {
      return !!this.getParsedEmail()?.getHtmlBody();
    },

    hasPlain() {
      return !!this.getParsedEmail()?.getTextBody();
    },

    _inlineAssets(html, attachments) {
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
    },

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

    _addressesFor(addrOrGrp) {
      return "email" in addrOrGrp ? [addrOrGrp.email] : addrOrGrp.group.map(addr => addr.email);
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
    },

    _toServerEmailMessage(value) {
      if (value === null) {
        return null;
      }
      let parsed = protonMime.parseMail(value);
      return new zx.server.email.Message().set({
        dateQueued: new Date(-Infinity),
        lastErrorMessage: null,
        subject: parsed.subject ?? null,
        from: parsed.from?.email ?? null,
        dateDelivered: parsed.date ?? null,
        to: parsed.to?.flatMap(this._addressesFor.bind(this)) ?? null,
        cc: parsed.cc?.flatMap(this._addressesFor.bind(this)) ?? null,
        bcc: parsed.bcc?.flatMap(this._addressesFor.bind(this)) ?? null,
        htmlBody: this._inlineAssets(parsed.body.html, parsed.attachments),
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
