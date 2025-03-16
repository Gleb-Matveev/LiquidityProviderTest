// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity =0.7.6;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '@uniswap/v3-core/contracts/libraries/TickMath.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@uniswap/v3-periphery/contracts/base/LiquidityManagement.sol';

import "hardhat/console.sol";

contract LiquidityProvider {

    INonfungiblePositionManager public positionManager;

    constructor(address npmAddress) {
        positionManager = INonfungiblePositionManager(
            npmAddress
        );
    }

    function provideLiquidity(address poolAddr, uint256 amount0ToMint, uint256 amount1ToMint, uint160 width) external {
        (address token0, address token1, uint24 poolFee, uint160 sqrtPriceX96, int24 tickSpacing) = getPoolParams(poolAddr);
        (int24 lowerTick, int24 upperTick) = getTicksFromBorders(amount0ToMint, amount1ToMint, width, sqrtPriceX96, tickSpacing);

        IERC20(token0).transferFrom(msg.sender, address(this), amount0ToMint);
        IERC20(token1).transferFrom(msg.sender, address(this), amount1ToMint);

        IERC20(token0).approve(address(positionManager), amount0ToMint);
        IERC20(token1).approve(address(positionManager), amount1ToMint);

        INonfungiblePositionManager.MintParams memory params =
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: poolFee,
                tickLower: lowerTick,
                tickUpper: upperTick,
                amount0Desired: amount0ToMint,
                amount1Desired: amount1ToMint,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            });

        (, , uint256 remains0, uint256 remains1) = positionManager.mint(params);

        if (remains0 < amount0ToMint) {
            TransferHelper.safeApprove(token0, address(positionManager), 0);
            uint256 refund0 = amount0ToMint - remains0;
            TransferHelper.safeTransfer(token0, msg.sender, refund0);
        }

        if (remains1 < amount1ToMint) {
            TransferHelper.safeApprove(token1, address(positionManager), 0);
            uint256 refund1 = amount1ToMint - remains1;
            TransferHelper.safeTransfer(token1, msg.sender, refund1);
        }
    }

    function getBordersFromAssets(uint256 amount0ToMint, uint256 amount1ToMint, uint160 width, uint160 sqrtPriceX96) internal pure returns (uint160 pa, uint160 pb) {
        if (amount0ToMint == 0) {
            pb = sqrtPriceX96;
            pa = uint160(sqrt(FullMath.mulDiv(FullMath.mulDiv(pb, pb, 1), (10000 - width), (10000 + width))));
        } else if (amount1ToMint == 0) {
            pa = sqrtPriceX96;
            pb = uint160(sqrt(FullMath.mulDiv(FullMath.mulDiv(pa, pa, 1), (10000 + width), (10000 - width))));
        } else {
            pa = uint160(computePa(width, sqrtPriceX96, amount0ToMint, amount1ToMint));
            pb = uint160(sqrt(FullMath.mulDiv(pa, pa * (width + 10000), (10000 - width))));
        }
    }

    function computePa(
        uint160 width,
        uint256 sqrtPriceX96,
        uint256 x,
        uint256 y
    ) internal pure returns (uint256 pa) {
        uint256 t = (width + 10000) / (10000 - width);
        uint256 p = sqrtPriceX96 * sqrtPriceX96;
        uint256 s = x * FullMath.mulDiv(p, (width + 10000), (10000 - width)) - 2 * FullMath.mulDiv(y, (width + 10000), (10000 - width)) + FullMath.mulDiv(y * y, t, x * p) - 4 * sqrt(FullMath.mulDiv(y, y * (width + 10000), (10000 - width)));
        uint256 sqrtd = sqrtPriceX96 * sqrt(s * x);

        uint256 numerator = p * sqrt(x * x * t) - sqrt(y * y * t) + sqrtd;
        uint256 denominator = 2 * x * sqrt(p * t);

        return numerator / denominator;
    }

    function getTicksFromBorders(uint256 amount0ToMint, uint256 amount1ToMint, uint160 width, uint160 sqrtPriceX96,  int24 tickSpacing) internal pure returns (int24, int24) {
        (uint160 pa, uint160 pb) = getBordersFromAssets(amount0ToMint, amount1ToMint, width, sqrtPriceX96);

        int24 lowerTick = TickMath.getTickAtSqrtRatio(pa);
        int24 upperTick = TickMath.getTickAtSqrtRatio(pb);

        if (lowerTick % tickSpacing != 0) {
            lowerTick = (lowerTick / tickSpacing) * tickSpacing + tickSpacing;
        }
        if (upperTick % tickSpacing != 0) {
            upperTick = (upperTick / tickSpacing) * tickSpacing;
        }

        return (lowerTick, upperTick);
    }

    function getPoolParams(address poolAddr) internal view returns (address token0, address token1, uint24 poolFee, uint160 sqrtPriceX96, int24 tickSpacing) {
            IUniswapV3Pool pool = IUniswapV3Pool(poolAddr);

            token0 = pool.token0();
            token1 = pool.token1();
            poolFee = pool.fee();
            tickSpacing = pool.tickSpacing();
            (sqrtPriceX96, , , , , ,) = pool.slot0();
    }

    receive() external payable {
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
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
}