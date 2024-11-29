qx.Class.define("zx.demo.remoteapi.PlayerMediaServerApi", {
  extend: zx.io.api.server.AbstractServerApi,
  construct() {
    super("zx.demo.remoteapi.PlayerMediaApi");

    this.__interval = setInterval(() => {
      this.publish("playingMedia", this.__currentMedia++);
    }, 1000);
  },
  properties: {},
  objects: {},
  members: {
    __currentMedia: 7,
    getCurrentMedia() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(this.__currentMedia);
        }, 200);
      });
    },

    playMedia(id) {
      console.log(`Playing media with id ${id}`);
      this.__currentMedia = id;
      return this.__currentMedia;
    }
  }
});
