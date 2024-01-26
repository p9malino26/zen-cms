qx.Class.define("zx.test.thin.DemoEmail", {
  extend: zx.thin.ui.container.Composite,
  implement: [zx.cms.content.IFeatureClientLifecycle],
  "@": zx.cms.content.anno.Feature.SIMPLE,

  construct() {
    super();
    this.add(
      <div>
        <h1>Hello Email Recipient!</h1>
        <p>This is an HTML email rendered on the fly by ZenCMS</p>
      </div>
    );

    let emailParameters = {
      to: "test@example.com",
      subject: "Hello Email Recipient!"
    };

    let scriptTag = <script type="text/plain" id="parameters"></script>;
    scriptTag.add(JSON.stringify(emailParameters, null, 2));
    this.add(scriptTag);
  },

  members: {
    /**
     * @Override
     */
    onReady(options) {
      let email = new zx.thin.puppeteer.api.EmailBrowserApi();

      email.addListener("start", () => {
        let params = qx.bom.Selector.query("#parameters")[0].innerHTML;
        params = JSON.parse(params);

        email.inlineStylesForEmail();
        email.sendEmail(document.body.outerHTML, params);
      });

      email.addListener("next", () => {
        email.complete();
      });
    }
  }
});
