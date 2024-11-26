/**
 * Basic implementation for storing session UUIDs for different hostnames
 * This class should be mixed into a class that implements IClientTransport
 */
qx.Mixin.define("zx.io.api.client.MSessionUuid", {
  construct() {
    /**
     * @type {{[hostname: string]: string}}
     */
    this.__sessionUuidForHostname = {};
  },
  members: {
    /**
     * Gets a session UUID for a particular hostname of a client API URI
     * @param {string?} hostname
     */
    getSessionUuid(hostname) {
      hostname ??= "none";
      return this.__sessionUuidForHostname[hostname];
    },

    /**
     * Returns a session UUID for a particular hostname of a client API URI
     * The implementation must be able to store a session UUID for a null hostname as well
     * @param {string?} hostname
     * @param {string} sessionUuid
     */
    setSessionUuid(hostname, sessionUuid) {
      hostname ??= "none";
      const existingUuid = this.__sessionUuidForHostname[hostname];
      if (existingUuid && existingUuid != sessionUuid) {
        this.warn(`Session UUID for hostname ${hostname} is being overwritten`);
      }
      this.__sessionUuidForHostname[hostname] = sessionUuid;
    }
  }
});
