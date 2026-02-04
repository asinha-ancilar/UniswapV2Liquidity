/** @type import('hardhat/config').HardhatUserConfig */

require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require('solidity-coverage');
require("@nomicfoundation/hardhat-verify");


module.exports = {
  solidity: "0.8.33",
  networks: {
    sepolia: {
       url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
       accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  }
};
