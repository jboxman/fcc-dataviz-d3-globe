//var liveServer = require('live-server');
require('live-server').start({
  "port": 8181,
  "host": "0.0.0.0",
  "root": ".",
  "mount": [["/js", "./js"], ["/css", "./css"], ["/vendor", "./vendor"]],
  "logLevel": 2,
  "open": false
});
