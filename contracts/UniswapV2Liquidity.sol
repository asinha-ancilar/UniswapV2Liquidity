// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UniswapV2Liquidity is ERC20 {

    IERC20 public token0;
    IERC20 public token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 private constant FEE_NUMERATOR = 3;
    uint256 private constant FEE_DENOMINATOR = 1000;


    constructor(address _token0, address _token1) ERC20("LPTOKEN","LPT"){
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint x, uint y) private pure returns (uint) {
        return x < y ? x : y;
    }

    function _updateReserves() private {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 shares){
        require(amount0 > 0 && amount1 > 0, "ZERO_AMOUNT");

        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);

        if (totalSupply() == 0) {
            shares = _sqrt(amount0 * amount1);
        } else {
            shares = _min(
                (amount0 * totalSupply()) / reserve0,
                (amount1 * totalSupply()) / reserve1
            );
        }

        require(shares > 0, "ZERO_SHARES");
        _mint(msg.sender, shares);
        _updateReserves();
    }

    function removeLiquidity(uint256 shares) external returns(uint256 amount0, uint256 amount1){
        require(shares > 0, "ZERO SHARES");

        amount0 = (shares * reserve0)/totalSupply();
        amount1 = (shares * reserve1) / totalSupply();

        _burn(msg.sender, shares);

        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);

        _updateReserves();
    }

    function getAmountOut( uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns(uint256){
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * (FEE_DENOMINATOR)) + amountInWithFee;
        return numerator/denominator;
    }

    /// @dev a simple single hop swap that takes exact input tokens for output tokens 
    /// @dev mimimcs `swapExactTokenForTokens` in uniswap v2 Router02 contract
    function simpleSwap(address tokenIn, uint256 amountIn) external 
    returns
    (
        uint256 amountOut
    )
    {
        require(amountIn > 0, "ZERO_INPUT");

        bool isToken0 = tokenIn == address(token0);
        require(isToken0 || tokenIn == address(token1), "INVALID_TOKEN");

        (IERC20 inToken, IERC20 outToken, uint256 reserveIn, uint256 reserveOut) = isToken0
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        inToken.transferFrom(msg.sender,address(this),amountIn);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);

        outToken.transfer(msg.sender, amountOut);

        _updateReserves();
    }
}
