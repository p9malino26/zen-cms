/**
 * This interface represents an objects which sends and receives data over a Bluetooth L2CAP socket
 */
qx.Interface.define("zx.io.api.transport.bluetooth.IL2CapSocket", {
  events: {
    /**
     * @type {*}
     * When data is received from the socket
     */
    receivedData: "qx.event.type.Data"
  },
  members: {
    /**
     * @param {*} data Sends data to the socket
     */
    sendData(data) {}
  }
});
