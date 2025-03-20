import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { expect } from "chai";
import hre from "hardhat";
import { deal } from "hardhat-deal";

describe("LiquidityProvider", function () {
  async function deployContract() {
    const [owner] = await ethers.getSigners();

    const npmAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

    const nfpManager = await ethers.getContractAt(
      "INonfungiblePositionManager", npmAddress
    );

    const liquidityProvider = await hre.ethers.deployContract("LiquidityProvider", [npmAddress]);
    const pool = await ethers.getContractAt("IUniswapV3Pool", "0x5969EFddE3cF5C0D9a88aE51E47d721096A97203");

    const token0 = await ethers.getContractAt("IERC20", await pool.token0()); // wbtc
    const token1 = await ethers.getContractAt("IERC20", await pool.token1()); // usdt

    return { owner, liquidityProvider, token0, token1, pool, nfpManager };
  }

  describe("Deployment", function () {
    it("Test npmManager address", async function () {
      const { owner, token0, token1, liquidityProvider } = await loadFixture(deployContract);

      expect(await liquidityProvider.positionManager()).to.equal("0xC36442b4a4522E871399CD717aBDD847Ab11FE88");
    });
  });

  describe("Maths", function () {
    let width = 6000;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 6000;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("1", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("85000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 9000;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);
      
      width = 9000;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("1", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("85000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 5000;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 5000;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("1", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("85000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 9950;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 9950;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("5", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("360000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 7500;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 7500;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("10", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("1000000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);

      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 5000;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 5000;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("0", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("85000", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);

      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
    width = 5000;
    it(`Test liquidity with width = ${width}`, async function () {
      const { liquidityProvider, nfpManager, pool, owner, token0, token1 } = await loadFixture(deployContract);

      width = 5000;
      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const address0 = "0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address0],
      });

      const cm0 = await ethers.provider.getSigner(address0);
      const amount0cur = ethers.parseUnits("1", 8);
      await token0.connect(cm0).transfer(owner, amount0cur);

      const address1 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address1],
      });

      const cm1 = await ethers.provider.getSigner(address1);
      const amount1cur = ethers.parseUnits("0", 6);
      await token1.connect(cm1).transfer(owner, amount1cur);

      await token0.approve(liquidityProvider, ethers.MaxUint256);
      await token1.approve(liquidityProvider, ethers.MaxUint256);

      ///////////////////////////////////////////////////////////////////////////////////////////////////////

      const transferAmount = ethers.parseEther("3");

      const tx = await owner.sendTransaction({
       to: liquidityProvider.getAddress(),
       value: transferAmount,
      });

      await tx.wait();

      const amount0 = await token0.balanceOf(owner);
      const amount1 = await token1.balanceOf(owner);
    
      await liquidityProvider.provideLiquidity(pool, amount0, amount1, width, {
        gasLimit: 30000000, 
      });

      const amount0_afterTransaction = Number(await token0.balanceOf(owner));
      const amount1_afterTransaction = Number(await token1.balanceOf(owner));

      const positionId = await nfpManager.tokenOfOwnerByIndex(owner, 0);
      const position = await nfpManager.positions(positionId);

      const upperPrice = 1.0001 ** Number(position.tickUpper);
      const lowerPrice = 1.0001 ** Number(position.tickLower);
      
      expect(10000 * (upperPrice - lowerPrice) / (lowerPrice + upperPrice)).to.be.approximately(width, width * 0.1);
      expect(
        Math.abs(amount0_afterTransaction) <= 0.03 * Math.abs(Number(amount1)) || 
        Math.abs(amount1_afterTransaction) <= 0.03 * Math.abs(Number(amount0))
      ).to.be.true;
    });
  });
});
