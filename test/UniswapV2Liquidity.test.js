const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Uniswap V2 Liquidity Testing", () => {
    let pool;
    let token0;
    let token1;

    let owner;
    let liquidityProvider1;
    let liquidityProvider2;
    let user;

    beforeEach("contract deployment", async () => {

        const Token = await ethers.getContractFactory('Token');

        token0 = await Token.deploy("Token0","TK0");
        await token0.waitForDeployment();
    
        token1 = await Token.deploy("Token1","TK1");
        await token1.waitForDeployment();

        pool = await ethers.deployContract('UniswapV2Liquidity',[
            await token0.getAddress(),
            await token1.getAddress()
        ]);
        await pool.waitForDeployment();
    })

    beforeEach('Minting tokens to signers', async () => {
        [owner, liquidityProvider1, liquidityProvider2, user] = await ethers.getSigners();

        await token0
            .mint(liquidityProvider1.address, ethers.parseEther('1000'));
        
        await token1
            .mint(liquidityProvider1.address, ethers.parseEther('1000'));

        await token0
            .mint(liquidityProvider2.address, ethers.parseEther('1000'));

        await token1
            .mint(liquidityProvider2.address, ethers.parseEther('1000'));
        
        await token1
            .mint(user.address, ethers.parseEther('100'));
    })

    it("adding liquidity first time", async () => {
        const amount0 = ethers.parseEther('100');
        const amount1 = ethers.parseEther('100');

        await token0
            .connect(liquidityProvider1)
            .approve(await pool.getAddress(), amount0);
        
        await token1
            .connect(liquidityProvider1)
            .approve(await pool.getAddress(), amount1);

        await pool
            .connect(liquidityProvider1)
            .addLiquidity(amount0, amount1);
        
        const shares = await pool.balanceOf(liquidityProvider1.address);
        expect(shares).to.equal(amount0);
    })
})