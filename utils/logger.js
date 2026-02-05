const fs = require("fs");
const info = (...params) => {
    console.log(...params)
  }
  
  const error = (...params) => {
    console.error(...params)
  }

  const logToFile = (filename,data) => {
    fs.writeFileSync(filename, data);
  }
  
  module.exports = {
    info, error, logToFile
  }
  