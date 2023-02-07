class Logger_0 {
  log(e) {
    console.log(`[${new Date().toLocaleString()}] ${e.toString()}`);
  }
}

export const Logger = new Logger_0();
