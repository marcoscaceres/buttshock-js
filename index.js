const Promise = require('bluebird');

function Handcrank() {
  this.consumerQueue = [];
  this.inputBuffer = [];
}

Handcrank.prototype = {
  input: function input(data) {
    this.inputBuffer.push(data);
    while (this.inputBuffer.length > 0) {
      if (this.consumerQueue.length == 0) {
        return;
      }
      var consumedLength = this.consumerQueue[0](this.input_buffer);
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
// c.input([0x2]);

// const SerialPort = require('serialport');
// var port = new SerialPort('/dev/ttyS0',
//                           { baudrate: 19200,
//                             // If only we had a viable parser to use
//                             parser: SerialPort.parsers.raw
//                           });

// function ET312(port) {
//   this._promiseQueue = [];
//   this._cryptoKey = 0x0;
//   this._port = port;
// }

// ET312.protoype = {
//   _handshake_internal: function _handshake_internal() {
//     this.port.write([0x0]);
//     p = new Promise()
//     yield 
//   },
//   handshake: function handshake() {
//     port.write([0x0]);
//   },
//   get_mode: function get_mode() {
//   }
// }


// port.on('open', function() {
//   port.write(new Buffer[0x0], function(err) {
//     if (err) {
//       return console.log("Can't start handshake!");
//     }
//     port.on('data', (data) => {
//       if (data.length != 1) {
//         return console.log("Handshake did not establish correctly!");
//       }
//       if (data[0] == 0x7) {
//         console.log("Handshake established!");
//       }
//     });
//   });
// });

// // open errors will be emitted as an error event
// port.on('error', function(err) {
//   console.log('Error: ', err.message);
// })
