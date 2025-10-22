import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy Ticketify smart contract to Sepolia testnet
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Checks deployer balance
 * 3. Deploys Ticketify contract with PYUSD address
 * 4. Verifies contract state
 * 5. Outputs deployment summary
 */
async function main() {
  console.log("\n🚀 Starting Ticketify Deployment to Sepolia...\n");

  // PYUSD Sepolia address
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";

  // Get deployer account
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  console.log("📋 Pre-deployment Information:");
  console.log("================================");
  console.log(`Deployer Address: ${deployer.account.address}`);
  console.log(`Network: Sepolia (Chain ID: 11155111)`);
  console.log(`PYUSD Address: ${PYUSD_ADDRESS}`);

  // Check deployer balance
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  const balanceInEth = Number(balance) / 1e18;
  console.log(`Deployer Balance: ${balanceInEth.toFixed(4)} ETH`);

  if (balanceInEth < 0.01) {
    console.warn("\n⚠️  Warning: Low balance! You might need more ETH for deployment.");
    console.warn("   Estimated gas cost: ~0.01-0.05 ETH\n");
  }

  // Validate PYUSD address
  if (PYUSD_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid PYUSD address!");
  }

  console.log("\n⏳ Deploying Ticketify contract...\n");

  // Deploy contract
  const ticketify = await hre.viem.deployContract("Ticketify", [PYUSD_ADDRESS]);

  console.log("✅ Contract deployed successfully!\n");

  console.log("📝 Deployment Summary:");
  console.log("================================");
  console.log(`Contract Address: ${ticketify.address}`);
  console.log(`Transaction Hash: Deployment transaction confirmed`);
  console.log(`Block Number: ${await publicClient.getBlockNumber()}`);
  console.log(`Network: Sepolia`);
  console.log(`Deployer: ${deployer.account.address}`);

  // Verify contract state
  console.log("\n🔍 Verifying Contract State:");
  console.log("================================");

  const owner = await ticketify.read.owner();
  const pyusdToken = await ticketify.read.pyusdToken();
  const platformFee = await ticketify.read.PLATFORM_FEE_BASIS_POINTS();
  const eventCounter = await ticketify.read.getEventCounter();

  console.log(`Owner: ${owner}`);
  console.log(`PYUSD Token: ${pyusdToken}`);
  console.log(`Platform Fee: ${platformFee} basis points (${Number(platformFee) / 100}%)`);
  console.log(`Event Counter: ${eventCounter}`);

  // Validation checks
  const checks = {
    ownerCorrect: owner.toLowerCase() === deployer.account.address.toLowerCase(),
    pyusdCorrect: pyusdToken.toLowerCase() === PYUSD_ADDRESS.toLowerCase(),
    feeCorrect: platformFee === 250n,
    counterZero: eventCounter === 0n,
  };

  console.log("\n✓ Validation Results:");
  console.log(`  Owner matches deployer: ${checks.ownerCorrect ? "✅" : "❌"}`);
  console.log(`  PYUSD address correct: ${checks.pyusdCorrect ? "✅" : "❌"}`);
  console.log(`  Platform fee correct (2.5%): ${checks.feeCorrect ? "✅" : "❌"}`);
  console.log(`  Event counter initialized: ${checks.counterZero ? "✅" : "❌"}`);

  const allChecksPass = Object.values(checks).every((check) => check);

  if (!allChecksPass) {
    console.error("\n❌ Contract validation failed! Check the results above.");
    process.exit(1);
  }

  console.log("\n✅ All validation checks passed!");

  // Next steps
  console.log("\n📋 Next Steps:");
  console.log("================================");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${ticketify.address} ${PYUSD_ADDRESS}`);
  console.log("\n2. Update environment variables:");
  console.log(`   - contracts/.env: CONTRACT_ADDRESS=${ticketify.address}`);
  console.log(`   - server/.env: CONTRACT_ADDRESS=${ticketify.address}`);
  console.log(`   - client/.env.local: NEXT_PUBLIC_CONTRACT_ADDRESS=${ticketify.address}`);
  console.log("\n3. View contract on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${ticketify.address}`);
  console.log("\n4. Test contract interaction:");
  console.log("   - Call view functions from Etherscan");
  console.log("   - Verify contract is readable and verified");

  console.log("\n✨ Deployment Complete! ✨\n");

  return ticketify.address;
}

// Execute deployment
main()
  .then((address) => {
    console.log(`\n🎉 Ticketify deployed at: ${address}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

