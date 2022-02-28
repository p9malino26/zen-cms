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



/**
 * @use(zx.server.WebServer)
 * @use(zx.test.io.remote.RemoteWindowChildFeature)
 * @use(zx.test.io.remote.RemoteThinXhrFeature)
 */
qx.Class.define("zx.cli.commands.ServeCommand", {
  extend: qx.core.Object,

  properties: {
    configFilename: {
      init: null,
      nullable: true,
      check: "String"
    },

    listenPort: {
      init: null,
      nullable: true,
      check: "Integer"
    }
  },

  environment: {
    "zx.cli.ServeCommand.ServerClassname": "zx.server.WebServer"
  },

  members: {
    __url: null,

    async run() {
      let config = new zx.server.Config();
      await config.loadConfig(this.getConfigFilename() || "cms.json");

      let classname = qx.core.Environment.get(
        "zx.cli.ServeCommand.ServerClassname"
      );
      let clazz = qx.Class.getByName(classname);
      let server = new clazz();
      let port = this.getListenPort() || config.getConfigData().port;
      if (port) server.setListenPort(port);
      try {
        await server.start();
        //new zx.test.io.remote.RemoteXhrServer();
      } catch (ex) {
        console.error("Cannot start server: " + (ex.stack || ex));
      }

      return null;
    }
  },

  statics: {
    createCliCommand() {
      let cmd = new zx.cli.Command("serve").set({
        description: "Runs the CMS Web Server",
        run: async function () {
          let cmd = new zx.cli.commands.ServeCommand();
          let { flags } = this.getValues();
          if (flags.port) cmd.setListenPort(flags.port);
          if (flags.config) cmd.setConfigFilename(flags.config);
          return await cmd.run();
        }
      });

      cmd.addFlag(
        new zx.cli.Flag("port").set({
          shortCode: "p",
          description: "Port to listen on",
          type: "integer"
        })
      );
      cmd.addFlag(
        new zx.cli.Flag("config").set({
          shortCode: "c",
          description: "config file to use, defaults to cms.json",
          type: "string"
        })
      );
      return cmd;
    }
  }
});
