const fs = require("fs");
const async = require("async");
const child_process = require("child_process");
//var fsPromises = require("fs").promises;
// node 8 compatibility
const { promisify } = require("util");
const fsPromises = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  unlink: promisify(fs.unlink)
};

const MODULE = {
  DEBUG: false,

  async runCommand(dir, ...args) {
    return new qx.Promise((resolve, reject) => {
      this.debug("Run: " + args.join(" "));
      let cmd = args.shift();
      let proc = child_process.spawn(cmd, args, {
        cwd: dir,
        shell: true
      });
      let result = {
        exitCode: null,
        output: "",
        messages: null
      };
      const onOut = data => {
        result.output += data;
        this.debug(data.toString("utf8"));
      };
      proc.stdout.on("data", onOut);
      proc.stderr.on("data", onOut);

      proc.on("close", code => {
        result.exitCode = code;
        this.debug("Exit: " + code);
        resolve(result);
      });
      proc.on("error", reject);
    });
  },

  log(...args) {
    console.log(...args);
  },

  debug(...args) {
    if (this.DEBUG) console.log(...args);
  }
};

MODULE.deleteRecursive = async function deleteRecursive(name) {
  return new Promise((resolve, reject) => {
    fs.exists(name, function (exists) {
      if (!exists) {
        return resolve();
      }
      deleteRecursiveImpl(name, err => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      });
      return null;
    });

    function deleteRecursiveImpl(name, cb) {
      fs.stat(name, function (err, stat) {
        if (err) {
          return cb && cb(err);
        }

        if (stat.isDirectory()) {
          fs.readdir(name, function (err, files) {
            if (err) {
              return cb && cb(err);
            }
            async.each(
              files,
              function (file, cb) {
                deleteRecursiveImpl(name + "/" + file, cb);
              },
              function (err) {
                if (err) {
                  return cb && cb(err);
                }
                fs.rmdir(name, cb);
                return null;
              }
            );
            return null;
          });
        } else {
          fs.unlink(name, cb);
        }
        return null;
      });
    }
  });
};

MODULE.safeDelete = async function safeDelete(filename) {
  try {
    await fsPromises.unlink(filename);
  } catch (ex) {
    if (ex.code == "ENOENT") return;
    throw ex;
  }
};

MODULE.readJson = async function readJson(filename) {
  if (!fs.existsSync(filename)) return null;
  let str = await fsPromises.readFile(filename, "utf8");
  return JSON.parse(str);
};

MODULE.writeJson = async function writeJson(filename, data) {
  await fsPromises.writeFile(filename, JSON.stringify(data, null, 2), "utf8");
};

module.exports = MODULE;
