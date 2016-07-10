const Promise = require('bluebird');

function Handcrank() {
  this.consumerQueue = [];
  this.inputBuffer = new Buffer([]);
}

Handcrank.prototype = {
  input: function input(data) {
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

const SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyS0',
                          { baudrate: 19200,
                            // If only we had a viable parser to use
                            parser: SerialPort.parsers.raw
                          });

function ET312(port) {
  this._key = undefined;
  this._port = port;
  this._crank = new Handcrank();
  this._port.on("data", function(data) {
    this._crank.input(data);
  }.bind(this));
}

ET312.prototype = {
  _encrypt_command: function _encrypt_command(data) {
  },
  _generate_checksum: function _generate_checksum(data) {
    var accum = 0;
    for (var i = 0; i < data.length; ++i) {
      accum += data[i];
    }
    if (accum > 256) {
      return accum % 256;
    }
    return accum;
  },
  _verify_checksum: function _verify_checksum(data, reject) {
    var checksum = data.readUInt8(data.length - 1);
    if (checksum != this._generate_checksum(data.slice(0, -1))) {
      reject("Checksums don't match!");
    }
  },
  _key_exchange: function _exchange_keys(data, resolve, reject) {
    if (data.length < 3) {
      return undefined;
    }
    this._verify_checksum(data, reject);
    if (data.readUInt8(0) != 0x21) {
      reject("Wrong return code on key exchange!");
    }
    this._key = data.readUInt8(1);
    resolve();
    return 3;
  },
  key_exchange: function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var key_command = [0x2f, 0x00];
      key_command.push(self._generate_checksum(key_command));
      console.log(key_command);
      self._port.write(key_command, function (error) {
        if (error) {
          reject(error);
        }
        self._crank.add(function (data) {
          return self._key_exchange(data, resolve, reject);
        });
      });
    });
  },
  _handshake_return: function _handshake_return(data, resolve, reject) {
    if (data.length < 1) {
      return undefined;
    }
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
    e.key_exchange().then(function () {
      console.log("Box key: " + e._key);
      port.close();
    }, function(err) {
      console.log("key exchange failed!");
      console.log(err);
      port.close();
    });
  }, function (err) {
    console.log("handshake failed!");
    console.log(err);
    port.close();
  });
});
