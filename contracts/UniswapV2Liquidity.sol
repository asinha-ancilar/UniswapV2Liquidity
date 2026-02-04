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

    

}
