/**
 *
 * Application that runs on a docker container, executing the tasks (zx.work.IWork)
 */
qx.Class.define("zx.demo.work.dockerPeer.Service", {
  extend: zx.work.runtime.DockerPeerService,
  construct() {
    super();
    zx.demo.work.TestWork;
    zx.demo.work.ErrorWork;
  }
});
