qx.Class.define("zx.demo.remoteapi.PlayerMediaServerApi", {
  extend: zx.io.api.server.AbstractServerApi,
  construct() {
    super("zx.demo.remoteapi.PlayerMediaApi");

    this.__interval = setInterval(() => {
      this.publish("playingMedia", this.__currentMedia++);
    }, 1000);

    //example addresses: localhost:8090/zx-api/player/media/playMedia/22
    //localhost:8090/zx-api/player/media/testmethod
    //localhost:8090/zx-api/player/media/getCurrentMedia

    this._registerGet("playMedia/{id}", (req, res) => {
      this.playMedia(req.getPathArgs().id);
      res.addData({ message: "success" });
    });
    this._registerGet("getCurrentMedia", async (req, res) => {
      let media = await this.getCurrentMedia();
      res.addData({ currentMedia: media });
    });
  },
  properties: {},
  objects: {},
  members: {
    /**@override */
    _publications: {
      /**
       * @type {number}
       */
      playingMedia: 0
    },

    __currentMedia: 7,

    getCurrentMedia() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(this.__currentMedia);
        }, 200);
      });
    },

    /**
     * @param {zx.io.api.server.MethodRequest} req
     */
    playMedia(id) {
      console.log(`called playMedia with id ${id}`);
      this.__currentMedia = id;
    },

    testMethod() {
      return "pigs";
    }
  }
});
