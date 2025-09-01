import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Trading = await ethers.getContractFactory("NeuralCreatorTrading");
  const trading = await Trading.deploy();
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log("NeuralCreatorTrading deployed at:", tradingAddress);

  const platformTreasury = deployer.address;
  const Revenue = await ethers.getContractFactory("RevenueSharing");
  const revenue = await Revenue.deploy(tradingAddress, platformTreasury);
  await revenue.waitForDeployment();
  const revenueAddress = await revenue.getAddress();
  console.log("RevenueSharing deployed at:", revenueAddress);

  // Wire contracts
  const tx1 = await trading.setRevenueContract(revenueAddress);
  await tx1.wait();
  console.log("Revenue contract set");

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});