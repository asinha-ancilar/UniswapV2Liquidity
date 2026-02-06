// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Minimal Uniswap v2 Liquidity Pool
/// @author Aayush Sinha
/// @notice Simple constant product AMM (x*y = k)
/// @dev
/// Implements:
/// - Liquidity addition (mint LP Tokens)
/// - Liquidity removal  (burn LP Tokens)
/// - Single hop swap with 0.3% of fee


contract UniswapV2Liquidity is ERC20 {

    /**
     * @notice First token of the pair
     */
    IERC20 public token0;

    /**
     * @notice Second token of the pair
     */
    IERC20 public token1;

    /**
     * @notice Reserve of token 0
     * @dev Updates after adding liquidity, removing liquidity and swap 
     */
    uint256 public reserve0;
    uint256 public reserve1;

    /**
     * @dev Fee = 0.3% => 3/1000
     */
    uint256 private constant FEE_NUMERATOR = 3;
    uint256 private constant FEE_DENOMINATOR = 1000;

    /**
     * 
     * @param _token0 Address of token 0
     * @param _token1 Address of token 1
     */
    constructor(address _token0, address _token1) ERC20("LPTOKEN","LPT"){
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    /**
     * @notice Babylonian Square root
     * @dev Used for initial LP share calculation
     * @param y The amount of liquidity of which square root needs to be calculated
     */
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

    /**
     * @notice Returns minimum of two values
     * @dev Used for calculating amount for minting LP Tokens for LP provider
     * @param x First number 
     * @param y Second number
     */
    function _min(uint x, uint y) private pure returns (uint) {
        return x < y ? x : y;
    }

    /**
     * @notice Syncs reserves with actual token balances
     * @dev Must be called after every state change (adding liquidity, removing liquidity and swapping)
     */
    function _updateReserves() private {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

    /**
     * @notice adds liquidity to the pool to mint LP Tokens
     * @param amount0 Amount of token 0 to deposit
     * @param amount1 Amount of token 1 to deposit
     */
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

    /**
     * @notice Remove Liquidity from pool to burn LP tokens to return proportional reserves
     * @param shares shares LP tokens to burn
     * @return amount0 amount0 token0 returned
     * @return amount1 amount1 token1 returned
     */
    function removeLiquidity(uint256 shares) external returns(uint256 amount0, uint256 amount1){
        require(shares > 0, "ZERO SHARES");

        amount0 = (shares * reserve0)/totalSupply();
        amount1 = (shares * reserve1) / totalSupply();

        _burn(msg.sender, shares);

        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);

        _updateReserves();
    }
    /**
     * @notice Calculates output amount using constant product formula
     * 
     * @dev 
     * Formula : 
     * amountInWithFee = amountIn * 997
     * numerator = amountInWithFee * reserveOut
     * denominator = reserveIn * 1000 + amountInWithFee
     * amountOut = numerator/denominator
     * 
     * @param amountIn Tokens being swapped In
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     * @return amountOut Output token amount
     */
    function getAmountOut( uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns(uint256){
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * (FEE_DENOMINATOR)) + amountInWithFee;
        return numerator/denominator;
    }


    /**
     * @notice Swaps Exact Input tokens for output tokens
     * @notice  Mimics UniswapV2Router.swapExactTokensForTokens (single hop)
     * @param tokenIn Address of input token
     * @param amountIn Exact input amount
     * @return amountOut Output tokens received
     */
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
