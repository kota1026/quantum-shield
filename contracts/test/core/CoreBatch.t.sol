// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ICoreBatch} from "../../src/interfaces/ICoreBatch.sol";
import {CoreBatch} from "../../src/core/CoreBatch.sol";
import {CoreVerifier} from "../../src/core/CoreVerifier.sol";
import {SPHINCSVerifier} from "../../src/SPHINCSVerifier.sol";

/// @title CoreBatchTest
/// @notice Unit tests for CoreBatch
/// @dev TEST-003: CoreBatch unit test (batch verification)
contract CoreBatchTest is Test {
    CoreBatch public batchVerifier;
    CoreVerifier public coreVerifier;
    SPHINCSVerifier public sphincsVerifier;

    // Test constants
    uint256 constant EXPECTED_MAX_BATCH_SIZE = 10;
    uint256 constant SIGNATURE_SIZE = 7856;
    uint256 constant PUBLIC_KEY_SIZE = 32;

    bytes32 constant TEST_MESSAGE = keccak256("batch test message");
    bytes constant TEST_PUBLIC_KEY = hex"0102030405060708091011121314151617181920212223242526272829303132";

    // Event definition for expectEmit (must match ICoreBatch.BatchVerified)
    event BatchVerified(
        uint256 indexed batchSize,
        uint256 validCount,
        uint256 totalGasUsed
    );

    function setUp() public {
        sphincsVerifier = new SPHINCSVerifier();
        coreVerifier = new CoreVerifier(address(sphincsVerifier));
        batchVerifier = new CoreBatch(address(coreVerifier));
    }

    // =========================================================================
    // Configuration Tests
    // =========================================================================

    function test_maxBatchSize() public view {
        assertEq(
            batchVerifier.MAX_BATCH_SIZE(),
            EXPECTED_MAX_BATCH_SIZE,
            "Max batch size should be 10"
        );
    }

    function test_getCoreVerifier() public view {
        assertEq(
            batchVerifier.getCoreVerifier(),
            address(coreVerifier),
            "Should return correct CoreVerifier address"
        );
    }

    // =========================================================================
    // Batch Verification Tests
    // =========================================================================

    function test_verifyBatch_emptyBatch() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](0);
        
        vm.expectRevert(ICoreBatch.EmptyBatch.selector);
        batchVerifier.verifyBatch(items);
    }

    function test_verifyBatch_exceedsMaxSize() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](11);
        
        for (uint256 i = 0; i < 11; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: TEST_MESSAGE,
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        vm.expectRevert(
            abi.encodeWithSelector(
                ICoreBatch.BatchTooLarge.selector,
                11,
                EXPECTED_MAX_BATCH_SIZE
            )
        );
        batchVerifier.verifyBatch(items);
    }

    function test_verifyBatch_singleItem() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](1);
        items[0] = ICoreBatch.BatchItem({
            message: TEST_MESSAGE,
            signature: new bytes(SIGNATURE_SIZE),
            publicKey: TEST_PUBLIC_KEY
        });
        
        ICoreBatch.BatchResult memory result = batchVerifier.verifyBatch(items);
        
        assertEq(result.totalCount, 1, "Total count should be 1");
        assertEq(result.validCount, 0, "Valid count should be 0 (invalid sig)");
        assertEq(result.results.length, 1, "Results array should have 1 element");
        assertFalse(result.results[0], "First result should be false");
    }

    function test_verifyBatch_multipleItems() public {
        uint256 batchSize = 5;
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](batchSize);
        
        for (uint256 i = 0; i < batchSize; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: keccak256(abi.encodePacked(TEST_MESSAGE, i)),
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        ICoreBatch.BatchResult memory result = batchVerifier.verifyBatch(items);
        
        assertEq(result.totalCount, batchSize, "Total count should match batch size");
        assertEq(result.validCount, 0, "Valid count should be 0 (all invalid)");
        assertEq(result.results.length, batchSize, "Results array should match batch size");
        assertTrue(result.totalGasUsed > 0, "Should report gas usage");
    }

    // =========================================================================
    // Threshold Tests
    // =========================================================================

    function test_verifyBatchWithThreshold_notMet() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](3);
        
        for (uint256 i = 0; i < 3; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: TEST_MESSAGE,
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        (bool passed, uint256 validCount) = batchVerifier.verifyBatchWithThreshold(items, 2);
        
        assertFalse(passed, "Should not pass threshold");
        assertEq(validCount, 0, "Valid count should be 0");
    }

    function test_verifyBatchCount() public view {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](2);
        
        for (uint256 i = 0; i < 2; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: TEST_MESSAGE,
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        uint256 validCount = batchVerifier.verifyBatchCount(items);
        assertEq(validCount, 0, "Valid count should be 0");
    }

    // =========================================================================
    // Gas Benchmark Tests
    // =========================================================================

    function test_verifyBatch_gasBenchmark() public {
        uint256 batchSize = 5;
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](batchSize);
        
        for (uint256 i = 0; i < batchSize; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: keccak256(abi.encodePacked(TEST_MESSAGE, i)),
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        uint256 gasBefore = gasleft();
        batchVerifier.verifyBatch(items);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Batch verification gas (5 items)", gasUsed);
        emit log_named_uint("Average per item", gasUsed / batchSize);
    }

    // =========================================================================
    // Event Tests
    // =========================================================================

    function test_verifyBatch_emitsBatchVerified() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](2);
        
        for (uint256 i = 0; i < 2; i++) {
            items[i] = ICoreBatch.BatchItem({
                message: TEST_MESSAGE,
                signature: new bytes(SIGNATURE_SIZE),
                publicKey: TEST_PUBLIC_KEY
            });
        }
        
        vm.expectEmit(true, false, false, false);
        emit BatchVerified(2, 0, 0);  // Any gas value
        
        batchVerifier.verifyBatch(items);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function test_constructor_zeroAddress() public {
        vm.expectRevert("Zero address");
        new CoreBatch(address(0));
    }

    function test_verifyBatchWithThreshold_zeroThreshold() public {
        ICoreBatch.BatchItem[] memory items = new ICoreBatch.BatchItem[](1);
        items[0] = ICoreBatch.BatchItem({
            message: TEST_MESSAGE,
            signature: new bytes(SIGNATURE_SIZE),
            publicKey: TEST_PUBLIC_KEY
        });
        
        (bool passed, uint256 validCount) = batchVerifier.verifyBatchWithThreshold(items, 0);
        
        assertTrue(passed, "Should pass with threshold 0");
        assertEq(validCount, 0, "Valid count should be 0");
    }
}
