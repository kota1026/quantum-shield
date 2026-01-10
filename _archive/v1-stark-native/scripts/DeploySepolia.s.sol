// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/SP1Groth16Verifier.sol";

/// @title DeploySepolia - Deployment Script for Sepolia Testnet
/// @notice Deploys Quantum Shield Bridge to Sepolia for EIP-197 compatibility testing
/// @dev Run with: forge script scripts/deploy/DeploySepolia.s.sol:DeploySepolia --rpc-url $SEPOLIA_RPC --broadcast --verify
contract DeploySepolia is Script {
    // Sepolia configuration
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;

    // Deployment addresses (will be set during deployment)
    address public verifierAddress;
    address public bridgeAddress;

    function run() external {
        // Validate we're on Sepolia
        require(block.chainid == SEPOLIA_CHAIN_ID, "Must deploy to Sepolia");

        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=============================================================");
        console.log("  Quantum Shield Bridge - Sepolia Deployment");
        console.log("=============================================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        console.log("");

        // Require minimum balance (lowered for testnet)
        require(deployer.balance >= 0.005 ether, "Insufficient balance (need >= 0.005 ETH)");

        // Get verification key hash (from SP1 circuit or placeholder)
        bytes32 vkHash = vm.envOr(
            "SP1_VK_HASH",
            keccak256("quantum_shield_sp1_vk_v1.0")
        );

        console.log("Configuration:");
        console.log("  VK Hash:", vm.toString(vkHash));
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy SP1Groth16Verifier
        console.log("Step 1: Deploying SP1Groth16Verifier...");
        SP1Groth16Verifier verifier = new SP1Groth16Verifier(vkHash);
        verifierAddress = address(verifier);
        console.log("  SP1Groth16Verifier deployed at:", verifierAddress);

        // Step 2: Deploy QuantumShieldBridge
        console.log("");
        console.log("Step 2: Deploying QuantumShieldBridge...");
        QuantumShieldBridge bridge = new QuantumShieldBridge(verifierAddress);
        bridgeAddress = address(bridge);
        console.log("  QuantumShieldBridge deployed at:", bridgeAddress);

        // Step 3: Verify deployment
        console.log("");
        console.log("Step 3: Verifying deployment...");

        // Check verifier connection
        require(address(bridge.verifier()) == verifierAddress, "Verifier not connected");
        console.log("  Verifier connected: OK");

        // Check owner
        require(bridge.owner() == deployer, "Owner mismatch");
        console.log("  Owner set: OK");

        // Check verifier type
        string memory verifierType = bridge.getVerifierType();
        console.log("  Verifier type:", verifierType);

        // Check quantum resistance status
        bool isQuantumResistant = bridge.isQuantumResistant();
        console.log("  Quantum resistant:", isQuantumResistant ? "Yes (STARK)" : "No (Groth16)");

        vm.stopBroadcast();

        // Step 4: Save deployment info
        console.log("");
        console.log("Step 4: Saving deployment info...");

        string memory deploymentInfo = string(
            abi.encodePacked(
                '{\n',
                '  "network": "sepolia",\n',
                '  "chainId": ', vm.toString(block.chainid), ',\n',
                '  "verifier": "', vm.toString(verifierAddress), '",\n',
                '  "bridge": "', vm.toString(bridgeAddress), '",\n',
                '  "vkHash": "', vm.toString(vkHash), '",\n',
                '  "deployer": "', vm.toString(deployer), '",\n',
                '  "timestamp": "', vm.toString(block.timestamp), '",\n',
                '  "verifierType": "', verifierType, '",\n',
                '  "isQuantumResistant": ', isQuantumResistant ? 'true' : 'false', '\n',
                '}'
            )
        );

        vm.writeFile("deployments/sepolia.json", deploymentInfo);
        console.log("  Saved to: deployments/sepolia.json");

        // Print summary
        console.log("");
        console.log("=============================================================");
        console.log("  Deployment Complete!");
        console.log("=============================================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  SP1Groth16Verifier:", verifierAddress);
        console.log("  QuantumShieldBridge:", bridgeAddress);
        console.log("");
        console.log("Next Steps:");
        console.log("  1. Verify contracts on Etherscan:");
        console.log("     forge verify-contract", vm.toString(verifierAddress), "SP1Groth16Verifier --chain sepolia");
        console.log("     forge verify-contract", vm.toString(bridgeAddress), "QuantumShieldBridge --chain sepolia");
        console.log("");
        console.log("  2. Test lock function:");
        console.log("     cast send", vm.toString(bridgeAddress), '"lock(bytes32)" 0x1234...', "--value 0.01ether --rpc-url $SEPOLIA_RPC");
        console.log("");
        console.log("  3. Monitor on Etherscan:");
        console.log("     https://sepolia.etherscan.io/address/", vm.toString(bridgeAddress));
    }
}

/// @title TestSepoliaDeployment - Post-deployment verification
/// @notice Tests the deployed contracts on Sepolia
contract TestSepoliaDeployment is Script {
    function run() external {
        // Load deployment addresses
        string memory deploymentJson = vm.readFile("deployments/sepolia.json");
        address bridgeAddress = vm.parseJsonAddress(deploymentJson, ".bridge");
        address verifierAddress = vm.parseJsonAddress(deploymentJson, ".verifier");

        console.log("=============================================================");
        console.log("  Quantum Shield Bridge - Sepolia Verification Test");
        console.log("=============================================================");
        console.log("");
        console.log("Bridge Address:", bridgeAddress);
        console.log("Verifier Address:", verifierAddress);

        QuantumShieldBridge bridge = QuantumShieldBridge(payable(bridgeAddress));

        // Test 1: Check basic contract state
        console.log("");
        console.log("Test 1: Contract State");
        console.log("  Owner:", bridge.owner());
        console.log("  Paused:", bridge.paused());
        console.log("  Total Locked:", bridge.totalLocked());
        console.log("  Nonce Counter:", bridge.nonceCounter());

        // Test 2: Check verifier
        console.log("");
        console.log("Test 2: Verifier Integration");
        console.log("  Verifier Address:", address(bridge.verifier()));
        console.log("  Verifier Type:", bridge.getVerifierType());
        console.log("  Quantum Resistant:", bridge.isQuantumResistant());

        // Test 3: Lock ETH (requires private key)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        if (deployer.balance >= 0.01 ether) {
            console.log("");
            console.log("Test 3: Lock ETH");

            vm.startBroadcast(deployerPrivateKey);

            // Create a test Dilithium pubkey hash
            bytes32 testPubKeyHash = keccak256("test_dilithium_pubkey_sepolia");
            uint256 lockAmount = 0.001 ether;

            bytes32 lockId = bridge.lock{value: lockAmount}(testPubKeyHash);
            console.log("  Lock ID:", vm.toString(lockId));
            console.log("  Amount:", lockAmount / 1e18, "ETH");

            // Check lock was created
            (address sender, uint256 amount, bytes32 pubKeyHash, , bool released) = bridge.getLock(lockId);
            console.log("  Lock Created: sender=", sender, "amount=", amount);
            require(!released, "Lock should not be released");

            vm.stopBroadcast();

            console.log("  Lock test: PASS");
        } else {
            console.log("");
            console.log("Test 3: Skipped (insufficient balance)");
        }

        // Test 4: EIP-197 Pairing Precompile Check
        console.log("");
        console.log("Test 4: EIP-197 Pairing Precompile");

        // Attempt to call the pairing precompile with known test vectors
        address BN254_PAIRING = address(0x08);

        // Simple pairing check: e(P1, P2) == e(G1, G2) for identity
        // This is a basic connectivity test, not a full verification
        bytes memory pairingInput = hex"00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa";

        (bool success, bytes memory result) = BN254_PAIRING.staticcall(pairingInput);

        if (success && result.length == 32) {
            uint256 pairingResult = abi.decode(result, (uint256));
            console.log("  Pairing precompile: AVAILABLE");
            console.log("  Test result:", pairingResult == 1 ? "VALID" : "INVALID");
        } else {
            console.log("  Pairing precompile: ERROR");
            console.log("  This may indicate EIP-197 is not available on this network");
        }

        console.log("");
        console.log("=============================================================");
        console.log("  Verification Complete");
        console.log("=============================================================");
    }
}

/// @title SepoliaProofTest - Test actual proof verification on Sepolia
/// @notice Submits a test proof to verify Groth16 verification works
contract SepoliaProofTest is Script {
    function run() external {
        // Load deployment addresses
        string memory deploymentJson = vm.readFile("deployments/sepolia.json");
        address bridgeAddress = vm.parseJsonAddress(deploymentJson, ".bridge");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("=============================================================");
        console.log("  Quantum Shield Bridge - Proof Verification Test");
        console.log("=============================================================");
        console.log("");
        console.log("Bridge Address:", bridgeAddress);

        QuantumShieldBridge bridge = QuantumShieldBridge(payable(bridgeAddress));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Lock some ETH
        bytes32 testPubKeyHash = keccak256("sepolia_proof_test");
        uint256 lockAmount = 0.001 ether;

        bytes32 lockId = bridge.lock{value: lockAmount}(testPubKeyHash);
        console.log("Created lock:", vm.toString(lockId));

        // Step 2: Prepare proof (mock for testing)
        // In production, this would come from SP1 prover
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }

        // Step 3: Prepare public inputs
        uint256[] memory publicInputs = new uint256[](8);
        publicInputs[0] = uint256(uint128(uint256(testPubKeyHash)));      // commitment_low
        publicInputs[1] = uint256(uint128(uint256(testPubKeyHash) >> 128)); // commitment_high
        publicInputs[2] = 1;                                                // num_signatures
        publicInputs[3] = uint256(uint128(uint256(lockId)));               // lock_id_low
        publicInputs[4] = uint256(uint128(uint256(lockId) >> 128));        // lock_id_high
        publicInputs[5] = uint256(uint160(msg.sender));                    // recipient
        publicInputs[6] = lockAmount;                                      // amount
        publicInputs[7] = 0;                                                // nonce

        console.log("Prepared public inputs");

        // Step 4: Attempt release (expected to succeed with mock verifier)
        try bridge.release(proof, publicInputs) {
            console.log("Release: SUCCESS");
            console.log("Proof verification passed on Sepolia!");
        } catch Error(string memory reason) {
            console.log("Release: FAILED");
            console.log("Reason:", reason);
        } catch {
            console.log("Release: FAILED (unknown error)");
        }

        vm.stopBroadcast();

        // Step 5: Check final state
        (, , , , bool released) = bridge.getLock(lockId);
        console.log("Lock released:", released);

        console.log("");
        console.log("=============================================================");
        console.log("  Test Complete");
        console.log("=============================================================");
    }
}
