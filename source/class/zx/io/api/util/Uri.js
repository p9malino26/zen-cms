qx.Class.define("zx.io.api.util.Uri", {
  type: "static",
  statics: {
    /**
     *
     * @param {string} uri
     * @returns Breaks out this URI into its components
     *
     * For example, the URI "http://www.example.com:8080/path/to/resource" would be broken out into:
     * fqdn: www.example.com
     * protocol: http
     * hostname: www.example.com:8080
     * port: 8080
     * path: /path/to/resource
     */
    breakoutUri(uri) {
      const LETTER = "[a-zA-Z]";
      const FQDN = `${LETTER}+(\.${LETTER}+)*`;
      const HOSTNAME = `(?<fqdn>${FQDN})(:(?<port>\\d+))?`;
      const REGEX_STR = `((?<protocol>${LETTER}+):\\/\\/)?(?<hostname>${HOSTNAME})?(?<path>\\/.*)`;
      let regex = new RegExp(REGEX_STR);
      let match = regex.exec(uri);
      return {
        fqdn: match.groups.fqdn ?? null,
        protocol: match.groups.protocol ?? null,
        hostname: match.groups.hostname ?? null,
        port: match.groups.port ?? null,
        path: match.groups.path ?? null
      };
    }
  }
});
