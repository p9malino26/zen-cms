qx.Class.define("zx.io.api.transport.BrowserLoopbackTransport", {
  extend: qx.core.Object,
  implement: zx.io.api.transport.ITransport,

  construct() {
    super();
  },

  properties: {
    fakeRemote: {
      init: null,
      nullable: true,
      check: "zx.io.api.transport.BrowserLoopbackTransport"
    }
  },

  events: {
    message: "qx.event.type.Data"
  },

  members: {
    postMessage(data) {
      let fakeRemote = this.getFakeRemote();
      if (fakeRemote) {
        setTimeout(() => fakeRemote._receiveData(data), 1);
      }
    },

    _receiveData(data) {
      this.fireDataEvent("message", data);
    }
  }
});
