qx.Class.define("zx.test.thin.DemoEmail", {
  extend: zx.thin.ui.container.Composite,
  implement: [zx.cms.content.IFeatureClientLifecycle],
  "@": zx.cms.content.anno.Feature.SIMPLE,

  construct() {
    super();

    if (qx.core.Environment.get("zx.io.remote.NetworkEndpoint.server")) {
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
    }
  },

  members: {
    /**
     * @Override
     */
    onReady(options) {
      let emailApi = zx.io.api.ApiUtils.createServerApi(zx.server.puppeteer.api.IPageApi);

      emailApi.addListener("start", () => {
        let params = qx.bom.Selector.query("#parameters")[0].innerHTML;
        params = JSON.parse(params);

        zx.thin.puppeteer.EmailUtils.inlineStylesForEmail();
        emailApi.publish("pageReady", {
          htmlBody: document.body.outerHTML,
          textBody: "Your email client does not support markup emails",
          parameters: params
        });
      });

      emailApi.addListener("next", () => {
        emailApi.publish("complete");
      });
    }
  }
});
