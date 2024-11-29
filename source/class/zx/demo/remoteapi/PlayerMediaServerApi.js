qx.Class.define("zx.demo.remoteapi.PlayerMediaServerApi", {
  extend: zx.io.api.server.AbstractServerApi,
  construct() {
    super("zx.demo.remoteapi.PlayerMediaApi");

    this.__interval = setInterval(() => {
      this.publish("playingMedia", this.__currentMedia++);
    }, 1000);

    this._registerMethod("playMedia", "playMedia/{id}");
    //localhost:8090/zx-remote-api/player/media/playMedia/22
  },
  properties: {},
  objects: {},
  members: {
    /**@override */
    _publications: {
      /**
       * @type {number}
       */
      playingMedia: {}
    },

    _methodParams: {
      getCurrentMedia: [],
      playMedia: ["id"]
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
    playMedia(req) {
      const { id } = req.getParams();
      console.log(`called playMedia with id ${id}`);
      this.__currentMedia = id;
    },

    testMethod() {
      return "pigs";
    }
  }
});
