const Promise = require('bluebird');

function Handcrank() {
  this.consumerQueue = [];
  this.inputBuffer = new Buffer([]);
  console.log(this.inputBuffer);
}

Handcrank.prototype = {
  input: function input(data) {
    console.log(this.inputBuffer);
    this.inputBuffer = Buffer.concat([this.inputBuffer, data]);
    while (this.inputBuffer.length > 0) {
      if (this.consumerQueue.length == 0) {
        return;
      }
      var consumedLength = this.consumerQueue[0](this.inputBuffer);
      if (consumedLength !== undefined) {
        this.inputBuffer = this.inputBuffer.slice(consumedLength);
        this.consumerQueue.shift();
      } else {
        return;
      }
    }
    return;
  },
  add: function add(f) {
    this.consumerQueue.push(f);
  }
};

// var internal_crank_test = function (buffer, length) {
//   if (buffer.length < length) {
//     return undefined;
//   }
//   return length;
// };

// function crank_test(desired_length) {
//   c.add(function (buf) {
//     return internal_crank_test(buf, desired_length);
//   });
// }

// var c = new Handcrank();
// crank_test(1);
// crank_test(2);
// c.input([0x0]);
// c.input([0x1]);
// c.input([0x2])

const SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyS0',
                          { baudrate: 19200,
                            // If only we had a viable parser to use
                            parser: SerialPort.parsers.raw
                          });

function ET312(port) {
  this._cryptoKey = 0x0;
  this._port = port;
  this._crank = new Handcrank();
  this._port.on("data", function(data) {
    this._crank.input(data);
  }.bind(this));
}

ET312.prototype = {
  _handshake_return: function _handshake_return(data, resolve, reject) {
    if (data.length < 1) {
      return undefined;
    }
    console.log(data);
    console.log("DATA IS " + data[0]);
    if (data.readUInt8(0) != 0x7) {
      reject();
    } else {
      resolve();
    }
    return 1;
  },
  handshake: function handshake() {
    var self = this;
    return new Promise(function (resolve, reject) {
      self._port.write([0x0], function (error) {
        if (error) {
          reject(error);
        }
        self._crank.add(function (data) {
          // This is promise context.
          return self._handshake_return(data, resolve, reject);
        });
      });
    });
  },
  get_mode: function get_mode() {
  }
};

port.on('open', function() {
  var e = new ET312(port);
  e.handshake().then(function () {
    console.log("handshake succeeded!");
    port.close();
  }, function (err) {
    console.log("handshake failed!");
    console.log(err);
    port.close();
  });
});
