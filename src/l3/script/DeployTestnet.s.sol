// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

// Core contracts imported from src/l3/src/
import {QSToken} from "../src/token/QSToken.sol";
import {veQS} from "../src/token/veQS.sol";
import {CoreLayer} from "../src/core/CoreLayer.sol";
import {Governor} from "../src/governance/Governor.sol";
import {InsuranceFund} from "../src/treasury/InsuranceFund.sol";
import {RewardRouter} from "../src/rewards/RewardRouter.sol";
import {GovernanceSwitch} from "../src/governance/GovernanceSwitch.sol";
import {SecurityCouncil} from "../src/governance/SecurityCouncil.sol";
import {Treasury} from "../src/treasury/Treasury.sol";
import {VeQSRewardDistributor} from "../src/token/VeQSRewardDistributor.sol";
import {ProverRewardPool} from "../src/rewards/ProverRewardPool.sol";
import {ObserverRewardPool} from "../src/rewards/ObserverRewardPool.sol";

/// @title DeployTestnetScript
/// @notice Deploys L3 contracts to a PUBLIC testnet (e.g., Arbitrum Sepolia)
/// @dev Prerequisites:
///   1. Set PRIVATE_KEY env var (deployer account, must have testnet ETH)
///   2. Set L3_TESTNET_RPC env var (e.g., https://sepolia-rollup.arbitrum.io/rpc)
///
///   Run with:
///     cd src/l3 && PRIVATE_KEY=<hex> forge script script/DeployTestnet.s.sol \
///       --rpc-url $L3_TESTNET_RPC --broadcast --verify --via-ir \
///       --etherscan-api-key $ARBISCAN_API_KEY
///
/// @dev After deployment, update:
///   - src/api/api/config/default.yaml (l3_endpoint, l3_chain_id, l3_*_address)
///   - .claude/rules/blockchain.md (L3 section)
///   - docs/ACTUAL_STATE.md (L3 testnet status)
contract DeployTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== L3 Testnet Contract Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Balance:", deployer.balance);

        require(deployer.balance > 0.001 ether, "Deployer needs testnet ETH (>0.001 ETH)");

        vm.startBroadcast(deployerPrivateKey);

        // 1. QSToken (prerequisite for veQS)
        QSToken qsToken = new QSToken(deployer, deployer);
        console.log("QSToken deployed at:", address(qsToken));

        // 2. veQS (requires QSToken)
        veQS veQSContract = new veQS(address(qsToken));
        console.log("veQS deployed at:", address(veQSContract));

        // 3. CoreLayer (no constructor args)
        CoreLayer coreLayer = new CoreLayer();
        console.log("CoreLayer deployed at:", address(coreLayer));

        // 4. InsuranceFund (admin only)
        InsuranceFund insuranceFund = new InsuranceFund(deployer);
        console.log("InsuranceFund deployed at:", address(insuranceFund));

        // 5. GovernanceSwitch (needed by Treasury)
        GovernanceSwitch govSwitch = new GovernanceSwitch(deployer);
        console.log("GovernanceSwitch deployed at:", address(govSwitch));

        // 6. Governor (requires veQS)
        Governor governor = new Governor(address(veQSContract), deployer);
        console.log("Governor deployed at:", address(governor));

        // 7. SecurityCouncil (9 members + governor)
        // For testnet, use deployer-derived addresses
        address[9] memory councilMembers;
        for (uint256 i = 0; i < 9; i++) {
            councilMembers[i] = vm.addr(deployerPrivateKey + i + 1);
        }
        SecurityCouncil securityCouncil = new SecurityCouncil(councilMembers, address(governor));
        console.log("SecurityCouncil deployed at:", address(securityCouncil));

        // 8. Treasury (requires GovernanceSwitch, SecurityCouncil, signers)
        address[] memory signers = new address[](3);
        signers[0] = deployer;
        signers[1] = vm.addr(deployerPrivateKey + 1);
        signers[2] = vm.addr(deployerPrivateKey + 2);
        Treasury treasury = new Treasury(
            address(govSwitch),
            address(securityCouncil),
            signers,
            2 // requiredApprovals
        );
        console.log("Treasury deployed at:", address(treasury));

        // 9. Reward sub-pools (needed by RewardRouter)
        VeQSRewardDistributor veQSDistributor = new VeQSRewardDistributor(
            address(veQSContract),
            address(qsToken),
            7 days, // epochDuration
            deployer
        );
        console.log("VeQSRewardDistributor deployed at:", address(veQSDistributor));

        ProverRewardPool proverPool = new ProverRewardPool(
            address(qsToken),
            7 days, // periodDuration
            deployer,
            deployer // rewardRouter placeholder
        );
        console.log("ProverRewardPool deployed at:", address(proverPool));

        ObserverRewardPool observerPool = new ObserverRewardPool(
            address(qsToken),
            address(insuranceFund),
            deployer,
            deployer // slashingContract placeholder
        );
        console.log("ObserverRewardPool deployed at:", address(observerPool));

        // 10. RewardRouter (requires all pools)
        RewardRouter rewardRouter = new RewardRouter(
            address(qsToken),
            address(veQSDistributor),
            address(proverPool),
            address(observerPool),
            address(treasury),
            deployer
        );
        console.log("RewardRouter deployed at:", address(rewardRouter));

        vm.stopBroadcast();

        // Output summary
        console.log("");
        console.log("=== TESTNET DEPLOYMENT SUMMARY ===");
        console.log("Chain ID:", block.chainid);
        console.log("");
        console.log("--- Copy to default.yaml ---");
        console.log("l3_core_layer_address:", address(coreLayer));
        console.log("l3_ve_qs_address:", address(veQSContract));
        console.log("l3_reward_router_address:", address(rewardRouter));
        console.log("l3_governor_address:", address(governor));
        console.log("l3_insurance_fund_address:", address(insuranceFund));
        console.log("l3_treasury_address:", address(treasury));
        console.log("");
        console.log("--- Additional Contracts ---");
        console.log("QSToken:", address(qsToken));
        console.log("GovernanceSwitch:", address(govSwitch));
        console.log("SecurityCouncil:", address(securityCouncil));
        console.log("VeQSRewardDistributor:", address(veQSDistributor));
        console.log("ProverRewardPool:", address(proverPool));
        console.log("ObserverRewardPool:", address(observerPool));
    }
}
