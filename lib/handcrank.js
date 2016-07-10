class Handcrank {
  constructor() {
    this.consumerQueue = [];
    this.inputBuffer = new Buffer([]);
  }

  input(data) {
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
  }

  add(f) {
    this.consumerQueue.push(f);
  }
}

module.exports = Handcrank;