const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const casterTokenAddress = process.env.CASTER_TOKEN_ADDRESS;
  const lpWalletAddress = process.env.LP_WALLET_ADDRESS;

  if (!casterTokenAddress || !lpWalletAddress) {
    throw new Error("Missing required environment variables");
  }

  console.log("Deploying with parameters:");
  console.log("CASTER Token:", casterTokenAddress);
  console.log("LP Wallet:", lpWalletAddress);

  const CastersPixels = await hre.ethers.getContractFactory("CastersPixels");
  const castersPixels = await CastersPixels.deploy(casterTokenAddress, lpWalletAddress);

  console.log("Deploying...");
  await castersPixels.waitForDeployment();
  const deployedAddress = await castersPixels.getAddress();

  console.log("CastersPixels deployed to:", deployedAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await hre.ethers.provider.waitForTransaction(castersPixels.deploymentTransaction().hash, 5);

  // Verify the contract
  console.log("Verifying contract on Basescan...");
  try {
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [casterTokenAddress, lpWalletAddress],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
