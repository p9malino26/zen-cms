/**
 *
 * Application that runs on a docker container, executing the tasks (zx.server.work.IWork)
 */
qx.Class.define("zx.demo.work.dockerPeer.Service", {
  extend: zx.server.work.runtime.DockerPeerService,
  construct() {
    super();
    zx.demo.work.TestWork;
    zx.demo.work.ErrorWork;
  }
});
