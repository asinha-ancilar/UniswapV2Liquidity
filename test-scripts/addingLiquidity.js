const { ethers } = require("hardhat");
const fs = require('fs');

const main = async () => {
    
    const addresses = fs.readFileSync(
        '../addresses-local.json',
        'utf-8'
    )
}