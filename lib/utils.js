var exec = require('child_process').exec, util = require('util'), shellEscape = require('shell-args-escape');

var isString = function (str) {
  return (typeof str == 'string' || str instanceof String);
};

module.exports.wp = function (use, args, flags, cb, execOptions) {
  var flagKeys, flagArgs;

  if (!Array.isArray(args))
    args = [args];
  if (!args)
    args = [];
  args = use.concat(args);

  if (!cb) {
    cb = flags;
    flags = {};
  }

  if (flags.format) flags.format = "json";

  if ((typeof flags == "object") && (flags !== null)) {
    flagKeys = Object.keys(flags);

    if (process.getuid && process.getuid() == 0) {
      flags["allow-root"] = true;// assuming you know what you're doing here
      flagKeys.unshift("allow-root");
    }

    flagArgs = flagKeys.map(function (k) {
      if (!Array.isArray(flags[k]))
        flags[k] = [flags[k]];
      return flags[k].map(function (flag) {
        if (flag === true)
          return util.format("--%s", k);
        return util.format("--%s=%s", k, shellEscape(flag));
      }).join(" ");
    }).join(" ");
  } else {
    flagArgs = '"' + flags + '"';
  }

  var helpIfError = function (e, out) {//this is too verbose - should look into formatting help
    if (!e)
      return cb(e, out);
		/*exec("wp help "+use.join(" "),function(err,stdout,stderr){
			if(!err)
				cb(e+"\n\n"+stdout,out);
			else
				cb(e,out);
		});*/
    // shelve this for now
    cb(e, out);
  };

  var cmd = "wp " + shellEscape(args) + " " + flagArgs;

  exec(cmd, execOptions, function (err, stdout, stderr) {

    console.log(cmd, stdout, stderr); // verosity

    if (flags.format == "json" && stdout) {
      try {
        helpIfError(err || stderr, JSON.parse(stdout));
      } catch (e) {
        helpIfError(err || stderr || e, stdout);
      }
    } else
      helpIfError(err || stderr, stdout);
  });
};