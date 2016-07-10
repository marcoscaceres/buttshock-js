const SerialPort = require('serialport');
const Handcrank = require('lib/Handcrank');
const ET312 = require("ET312");
const opts = {
  baudrate: 19200,
  // If only we had a viable parser to use
  parser: SerialPort.parsers.raw
};

port.on('open', function() {
  var e = new ET312(port);
  e.handshake().then(function() {
    console.log("handshake succeeded!");
    e.key_exchange().then(function() {
      console.log("Box key: " + e._key);
      port.close();
    }, function(err) {
      console.log("key exchange failed!");
      console.log(err);
      port.close();
    });
  }, function(err) {
    console.log("handshake failed!");
    console.log(err);
    port.close();
  });
});
