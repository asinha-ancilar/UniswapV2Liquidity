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

    beforeEach("adding liquidity first time", async () => {
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
    })

    it("adding liquidity first time test", async () => {
        const amount = ethers.parseEther('100');
        const shares = await pool.balanceOf(liquidityProvider1.address);
        expect(shares).to.equal(amount);
    })

    it("adding liquidity second time", async () => {
        const amount0 = ethers.parseEther('100');
        const amount1 = ethers.parseEther('100');
        await token0
            .connect(liquidityProvider2)
            .approve(await pool.getAddress(), amount0);
        
        await token1
            .connect(liquidityProvider2)
            .approve(await pool.getAddress(), amount1);

        await pool
            .connect(liquidityProvider2)
            .addLiquidity(amount0, amount1);
        

        const shares = await pool.balanceOf(liquidityProvider2.address);

        const totalSupply = await pool.totalSupply();
        const reserve0 = await pool.reserve0();

        const shareProvided = (amount0 * totalSupply) / reserve0
        
        expect(shares).to.equal(shareProvided); 
    })

    it("simple swap", async () => {
        const amountIn = ethers.parseEther('10');

        await token1
            .connect(user)
            .approve(await pool.getAddress(), amountIn);

        const reserveIn = await pool
            .reserve1();
        
        const reserveOut = await pool
            .reserve0();
        
        const amountOut = await pool
            .getAmountOut(amountIn,reserveIn, reserveOut)
        
        await pool
            .connect(user)
            .simpleSwap(await token1.getAddress(), amountIn)
        
        const userBalanceOfToken0 = await token0
            .balanceOf(user)
        
        expect(userBalanceOfToken0).to.equal(amountOut)
    })

    it("removing liquidity", async () => {
        const amountIn = ethers.parseEther('10');

        await token1
            .connect(user)
            .approve(await pool.getAddress(), amountIn);
        
        await pool
            .connect(user)
            .simpleSwap(await token1.getAddress(), amountIn);

        const balance0before = await token0
            .balanceOf(liquidityProvider1.address);
        
        const balance1before = await token1
            .balanceOf(liquidityProvider1.address)
        
        const shares = await pool
            .balanceOf(liquidityProvider1.address);
        
        await pool
            .connect(liquidityProvider1)
            .removeLiquidity(shares);
        
        const balance0after = await token0
            .balanceOf(liquidityProvider1.address)
        
        const balance1after = await token1
            .balanceOf(liquidityProvider1.address);
        
        expect(balance0after).to.be.greaterThan(balance0before);
        expect(balance1after).to.be.greaterThan(balance1before);
    })

    it("zero amount adding liquidity test", async () => {
        const amount0 = ethers.parseEther('0');
        const amount1 = ethers.parseEther('0');

        await token0
            .connect(liquidityProvider2)
            .approve(await pool.getAddress(), amount0);
        
        await token1
            .connect(liquidityProvider2)
            .approve(await pool.getAddress(), amount1);

        await expect(pool.connect(liquidityProvider2).addLiquidity(amount0,amount1)).to.be.revertedWith("ZERO_AMOUNT");
    })

    it("removing liquidity with zero shares", async () => {
        const shares = await pool
            .balanceOf(user.address)
        await expect(pool.connect(user).removeLiquidity(shares)).to.be.revertedWith("ZERO SHARES");
    })

    it("swapping with zero input amount", async () => {
        const amountIn = ethers.parseEther('0');

        await token1
            .connect(user)
            .approve(await pool.getAddress(), amountIn);
        
        await expect(pool.connect(user).simpleSwap(await token1.getAddress(), amountIn)).to.be.revertedWith("ZERO_INPUT")
    })

    it("test for invalid token", async () => {
        const invalidToken = await ethers.deployContract('Token', ['InvalidToken','IVT']);
        await invalidToken.waitForDeployment();

        const amountIn = ethers.parseEther('1');

        await invalidToken
            .mint(user.address, amountIn);
        
        await invalidToken
            .connect(user)
            .approve(await pool.getAddress(),amountIn);
        
        await expect(pool.connect(user).simpleSwap(await invalidToken.getAddress(), amountIn)).to.be.revertedWith('INVALID_TOKEN');

    })
})

describe("Uniwap v2 testing with small liquidity", () => {

    let pool;
    let token0;
    let token1;

    let owner;
    let liquidityProvider

    
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
        [owner, liquidityProvider] = await ethers.getSigners();

        await token0
            .mint(liquidityProvider.address, ethers.parseEther('1'));
        
        await token1
            .mint(liquidityProvider.address, ethers.parseEther('1000'));
    })

    it("adding small liquidity for first time", async () => {

        const amount0 = 1n;
        const amount1 = 1n;
        const shareAmount = 1n;

        await token0
            .connect(liquidityProvider)
            .approve(pool.getAddress(),amount0);
        
        await token1
            .connect(liquidityProvider)
            .approve(pool.getAddress(),amount1);
        
        await pool
            .connect(liquidityProvider)
            .addLiquidity(amount0, amount1);
        
        const share = await pool
            .balanceOf(liquidityProvider.address);
        
        expect(share).to.be.equal(shareAmount);
    })

})