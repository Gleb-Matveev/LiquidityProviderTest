// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DEFAULT_NPM_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

module.exports = buildModule("LiquidityProviderModule", (m) => {
  const npmAddress = m.getParameter("npmAddress", DEFAULT_NPM_ADDRESS);
  const liquidityProvider = m.contract("LiquidityProvider", [npmAddress]);

  return { liquidityProvider };
});