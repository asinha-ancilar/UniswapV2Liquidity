const logger = require('../utils/logger');

async function main(){}

main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});