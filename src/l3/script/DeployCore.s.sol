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

/// @title DeployCoreScript
/// @notice Deploys the 6 core L3 contracts needed by the Rust API to local Anvil
/// @dev Run with: FOUNDRY_PROFILE=l3 forge script src/l3/script/DeployCore.s.sol --rpc-url http://localhost:8545 --broadcast
contract DeployCoreScript is Script {
    function run() external {
        // Use Anvil default account #0
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== L3 Core Contract Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. QSToken (prerequisite for veQS)
        QSToken qsToken = new QSToken(deployer, deployer);
        console.log("QSToken deployed at:", address(qsToken));

        // 2. veQS (requires QSToken)
        veQS veQSContract = new veQS(address(qsToken));
        console.log("veQS deployed at:", address(veQSContract));

        // 3. CoreLayer (requires a deployed IStateVerifier — FR-L3-1)
        // Deploy it first from the L1 project:
        //   cd src/l1/contracts && forge script script/DeployL3StateVerifier.s.sol --rpc-url <l3-rpc> --broadcast
        // then export QS_STATE_VERIFIER=<L3StateVerifier address>
        CoreLayer coreLayer = _deployCoreLayer();

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
            deployer // rewardRouter (placeholder, set after RewardRouter deploy)
        );
        console.log("ProverRewardPool deployed at:", address(proverPool));

        ObserverRewardPool observerPool = new ObserverRewardPool(
            address(qsToken),
            address(insuranceFund),
            deployer,
            deployer // slashingContract (placeholder)
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

        // Output summary for config
        console.log("");
        console.log("=== API Config Values (for default.yaml) ===");
        console.log("l3_core_layer_address:", address(coreLayer));
        console.log("l3_ve_qs_address:", address(veQSContract));
        console.log("l3_reward_router_address:", address(rewardRouter));
        console.log("l3_governor_address:", address(governor));
        console.log("l3_insurance_fund_address:", address(insuranceFund));
        console.log("l3_treasury_address:", address(treasury));
    }
    /// @dev FR-L3-1: CoreLayer refuses to deploy without a real proof verifier
    function _deployCoreLayer() internal returns (CoreLayer coreLayer) {
        address verifier = vm.envOr("QS_STATE_VERIFIER", address(0));
        require(verifier != address(0), "QS_STATE_VERIFIER not set: deploy src/l1/contracts/script/DeployL3StateVerifier.s.sol first");
        coreLayer = new CoreLayer(verifier, vm.envOr("QS_GENESIS_STATE_ROOT", bytes32(0)));
        console.log("CoreLayer deployed at:", address(coreLayer));
        console.log("  state verifier:", verifier);
    }

}
