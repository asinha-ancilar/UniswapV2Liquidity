const logger = require('../utils/logger');
const { ethers } = require("hardhat");

async function main(){
  const Token = await ethers.getContractFactory("Token");

  const token0 = await Token.deploy("Token0","TK0");
  const token1 = await Token.deploy("Token1","TK1");

  await token0.waitForDeployment();
  await token1.waitForDeployment();

  const Pool = await ethers.deployContract('UniswapV2Liquidity',[
    await token0.getAddress(),
    await token1.getAddress()
  ])

  await Pool.waitForDeployment();

  const addresses = {
    token0: await token0.getAddress(),
    token1: await token1.getAddress(),
    pool: await Pool.getAddress()
  }

  logger.logToFile('addresses.json', JSON.stringify(addresses,null,2));

  logger.info('Pool address: ', await Pool.getAddress());
  logger.info('Token-0 address: ',await token0.getAddress());
  logger.info('Token-1 address: ',await token1.getAddress());
}

main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});