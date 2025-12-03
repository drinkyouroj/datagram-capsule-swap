const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const CAPSULE_NFT_CONTRACT = "0xC9Af289cd84864876b5337E3ef092B205f47d65F";
  
  // Wallet B Public Address
  const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS;
  if (!SIGNER_ADDRESS) {
    console.warn("WARNING: SIGNER_ADDRESS not set in .env.local");
  }

  // Wallet C Public Address
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  if (!TREASURY_ADDRESS) {
     console.warn("WARNING: TREASURY_ADDRESS not set in .env.local");
  }

  const signer = SIGNER_ADDRESS || deployer.address;
  const treasury = TREASURY_ADDRESS || deployer.address;

  console.log("Signer (Wallet B):", signer);
  console.log("Treasury (Wallet C):", treasury);

  const CapsuleSwap = await hre.ethers.getContractFactory("CapsuleSwap");
  const swap = await CapsuleSwap.deploy(CAPSULE_NFT_CONTRACT, signer, treasury);

  await swap.waitForDeployment();

  console.log("CapsuleSwap deployed to:", await swap.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
