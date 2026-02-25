// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3Hasher} from "../libraries/SHA3Hasher.sol";

/**
 * @title AIRConstraints
 * @author Quantum Shield Team
 * @notice Algebraic Intermediate Representation (AIR) constraint definitions
 * @dev Implements constraint system for STARK proofs
 * 
 * ## Overview
 * AIR constraints define the rules that a valid execution trace must satisfy.
 * They consist of:
 * - Boundary constraints: conditions at specific trace positions
 * - Transition constraints: rules between consecutive trace elements
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses SHA3-256 for all hash operations (domain separation)
 * - Goldilocks field (2^64 - 2^32 + 1) for all arithmetic
 * - 128-bit security level
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.1.0
 */
contract AIRConstraints {
    using SHA3Hasher for bytes;

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Goldilocks prime field modulus: 2^64 - 2^32 + 1
    uint256 public constant FIELD_MODULUS = 0xFFFFFFFF00000001;

    /// @notice Maximum supported constraint degree
    uint256 public constant MAX_CONSTRAINT_DEGREE = 8;

    /// @notice Minimum trace length for verification
    uint256 public constant MIN_TRACE_LENGTH = 2;

    // =========================================================================
    // Structs
    // =========================================================================

    /**
     * @notice Boundary constraint definition
     * @param index Position in trace where constraint applies
     * @param expectedValue Expected value at that position
     */
    struct BoundaryConstraint {
        uint256 index;
        uint256 expectedValue;
    }

    /**
     * @notice AIR configuration parameters
     * @param traceLength Length of the execution trace
     * @param numBoundaryConstraints Number of boundary constraints
     * @param numTransitionConstraints Number of transition constraints
     * @param blowupFactor LDE blowup factor (typically 4 or 8)
     */
    struct AIRConfig {
        uint256 traceLength;
        uint256 numBoundaryConstraints;
        uint256 numTransitionConstraints;
        uint256 blowupFactor;
    }

    // =========================================================================
    // Errors
    // =========================================================================

    /// @notice Thrown when trace length is invalid
    error InvalidTraceLength();

    /// @notice Thrown when constraint index is out of bounds
    error ConstraintIndexOutOfBounds();

    /// @notice Thrown when field element exceeds modulus
    error FieldOverflow();

    /// @notice Thrown when constraint verification fails
    error ConstraintVerificationFailed();

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when AIR verification completes
    event AIRVerified(uint256 traceLength, bool valid);

    /// @notice Emitted when boundary constraint is checked
    event BoundaryConstraintChecked(uint256 indexed index, uint256 value, bool valid);

    // =========================================================================
    // Version Information
    // =========================================================================

    /**
     * @notice Get contract version information
     * @return name Contract name
     * @return version Version string
     */
    function getVersion() external pure returns (string memory name, string memory version) {
        return ("AIRConstraints", "0.1.0");
    }

    /**
     * @notice Get maximum constraint degree
     * @return Maximum polynomial degree for constraints
     */
    function maxConstraintDegree() external pure returns (uint256) {
        return MAX_CONSTRAINT_DEGREE;
    }

    // =========================================================================
    // Boundary Constraint Verification
    // =========================================================================

    /**
     * @notice Verify a single boundary constraint
     * @param actualValue The actual value at the boundary
     * @param expectedValue The expected value
     * @param index The position index (for logging)
     * @return valid True if constraint is satisfied
     */
    function verifyBoundaryConstraint(
        uint256 actualValue,
        uint256 expectedValue,
        uint256 index
    ) public pure returns (bool valid) {
        // Reduce values to field
        actualValue = actualValue % FIELD_MODULUS;
        expectedValue = expectedValue % FIELD_MODULUS;
        
        return actualValue == expectedValue;
    }

    /**
     * @notice Verify multiple boundary constraints
     * @param trace The execution trace
     * @param constraints Array of boundary constraints
     * @return valid True if all constraints are satisfied
     */
    function verifyBoundaryConstraints(
        uint256[] memory trace,
        BoundaryConstraint[] memory constraints
    ) public pure returns (bool valid) {
        if (trace.length == 0) {
            revert InvalidTraceLength();
        }

        for (uint256 i = 0; i < constraints.length; i++) {
            BoundaryConstraint memory c = constraints[i];
            
            if (c.index >= trace.length) {
                revert ConstraintIndexOutOfBounds();
            }

            if (!verifyBoundaryConstraint(trace[c.index], c.expectedValue, c.index)) {
                return false;
            }
        }

        return true;
    }

    // =========================================================================
    // Transition Constraint Evaluation
    // =========================================================================

    /**
     * @notice Evaluate doubling transition constraint
     * @dev Constraint: next = 2 * current (returns 0 if satisfied)
     * @param current Current trace value
     * @param next Next trace value
     * @return constraintValue 0 if satisfied, non-zero otherwise
     */
    function evaluateDoublingConstraint(
        uint256 current,
        uint256 next
    ) public pure returns (uint256 constraintValue) {
        current = current % FIELD_MODULUS;
        next = next % FIELD_MODULUS;

        // Constraint: next - 2*current = 0
        uint256 doubled = mulmod(current, 2, FIELD_MODULUS);
        
        // Return (next - doubled) mod p
        if (next >= doubled) {
            return (next - doubled) % FIELD_MODULUS;
        } else {
            return (FIELD_MODULUS - doubled + next) % FIELD_MODULUS;
        }
    }

    /**
     * @notice Evaluate Fibonacci transition constraint
     * @dev Constraint: next2 = next1 + current (returns 0 if satisfied)
     * @param current Current value (trace[i])
     * @param next1 Next value (trace[i+1])
     * @param next2 Value after next (trace[i+2])
     * @return constraintValue 0 if satisfied, non-zero otherwise
     */
    function evaluateFibonacciConstraint(
        uint256 current,
        uint256 next1,
        uint256 next2
    ) public pure returns (uint256 constraintValue) {
        current = current % FIELD_MODULUS;
        next1 = next1 % FIELD_MODULUS;
        next2 = next2 % FIELD_MODULUS;

        // Constraint: next2 - (next1 + current) = 0
        uint256 expected = addmod(current, next1, FIELD_MODULUS);
        
        if (next2 >= expected) {
            return (next2 - expected) % FIELD_MODULUS;
        } else {
            return (FIELD_MODULUS - expected + next2) % FIELD_MODULUS;
        }
    }

    /**
     * @notice Evaluate polynomial transition constraint
     * @dev Constraint: (next - 2*current) * (next - current - 1) = 0
     * This allows either doubling OR incrementing by 1
     * @param current Current trace value
     * @param next Next trace value
     * @return valid True if constraint is satisfied
     */
    function evaluatePolynomialConstraint(
        uint256 current,
        uint256 next
    ) public pure returns (bool valid) {
        current = current % FIELD_MODULUS;
        next = next % FIELD_MODULUS;

        // Check if doubling constraint is satisfied
        uint256 doubled = mulmod(current, 2, FIELD_MODULUS);
        if (next == doubled) {
            return true;
        }

        // Check if increment constraint is satisfied
        uint256 incremented = addmod(current, 1, FIELD_MODULUS);
        if (next == incremented) {
            return true;
        }

        return false;
    }

    /**
     * @notice Evaluate all transition constraints for a trace
     * @dev Uses doubling constraint: trace[i+1] = 2 * trace[i]
     * @param trace The execution trace
     * @return valid True if all transitions are valid
     */
    function evaluateAllTransitionConstraints(
        uint256[] memory trace
    ) public pure returns (bool valid) {
        if (trace.length < MIN_TRACE_LENGTH) {
            revert InvalidTraceLength();
        }

        for (uint256 i = 0; i < trace.length - 1; i++) {
            uint256 constraintValue = evaluateDoublingConstraint(trace[i], trace[i + 1]);
            if (constraintValue != 0) {
                return false;
            }
        }

        return true;
    }

    // =========================================================================
    // Full AIR Verification
    // =========================================================================

    /**
     * @notice Verify complete AIR constraints
     * @param trace The execution trace
     * @param config AIR configuration
     * @param boundaryConstraints Array of boundary constraints
     * @return valid True if all AIR constraints are satisfied
     */
    function verifyAIR(
        uint256[] memory trace,
        AIRConfig memory config,
        BoundaryConstraint[] memory boundaryConstraints
    ) public pure returns (bool valid) {
        // Validate trace length
        if (trace.length == 0 || trace.length != config.traceLength) {
            revert InvalidTraceLength();
        }

        // Verify boundary constraints
        if (!verifyBoundaryConstraints(trace, boundaryConstraints)) {
            return false;
        }

        // Verify transition constraints
        if (!evaluateAllTransitionConstraints(trace)) {
            return false;
        }

        return true;
    }

    // =========================================================================
    // Constraint Polynomial Operations
    // =========================================================================

    /**
     * @notice Compute constraint polynomial at a given point
     * @dev For boundary constraint at index i: (x - ω^i) divides C(x)
     * @param x Evaluation point
     * @param omega Domain generator (root of unity)
     * @param boundaryIndex Index of boundary constraint
     * @return zerofier The zerofier polynomial value at x
     */
    function computeBoundaryZerofier(
        uint256 x,
        uint256 omega,
        uint256 boundaryIndex
    ) public pure returns (uint256 zerofier) {
        x = x % FIELD_MODULUS;
        omega = omega % FIELD_MODULUS;

        // Compute ω^boundaryIndex
        uint256 omegaPow = _modExp(omega, boundaryIndex, FIELD_MODULUS);

        // Zerofier: (x - ω^boundaryIndex)
        if (x >= omegaPow) {
            return (x - omegaPow) % FIELD_MODULUS;
        } else {
            return (FIELD_MODULUS - omegaPow + x) % FIELD_MODULUS;
        }
    }

    /**
     * @notice Compute transition constraint zerofier
     * @dev For transition constraints, zerofier is: (x^n - 1) / (x - ω^(n-1))
     * @param x Evaluation point
     * @param omega Domain generator
     * @param traceLength Length of trace (domain size)
     * @return zerofier The zerofier polynomial value at x
     */
    function computeTransitionZerofier(
        uint256 x,
        uint256 omega,
        uint256 traceLength
    ) public pure returns (uint256 zerofier) {
        x = x % FIELD_MODULUS;
        omega = omega % FIELD_MODULUS;

        // Compute x^n - 1
        uint256 xn = _modExp(x, traceLength, FIELD_MODULUS);
        uint256 xnMinus1;
        if (xn >= 1) {
            xnMinus1 = xn - 1;
        } else {
            xnMinus1 = FIELD_MODULUS - 1 + xn;
        }

        // Compute ω^(n-1)
        uint256 omegaLast = _modExp(omega, traceLength - 1, FIELD_MODULUS);

        // Compute (x - ω^(n-1))
        uint256 denominator;
        if (x >= omegaLast) {
            denominator = x - omegaLast;
        } else {
            denominator = FIELD_MODULUS - omegaLast + x;
        }

        // Handle division by zero
        if (denominator == 0) {
            return 0; // At the excluded point
        }

        // Return (x^n - 1) / (x - ω^(n-1))
        uint256 denominatorInv = _modInverse(denominator, FIELD_MODULUS);
        return mulmod(xnMinus1, denominatorInv, FIELD_MODULUS);
    }

    // =========================================================================
    // Domain Operations
    // =========================================================================

    /**
     * @notice Compute domain generator for given size
     * @param domainSize Size of the domain (must be power of 2)
     * @return omega The domain generator (root of unity)
     */
    function computeDomainGenerator(
        uint256 domainSize
    ) public pure returns (uint256 omega) {
        require(domainSize > 0, "Domain size must be positive");
        require((domainSize & (domainSize - 1)) == 0, "Domain size must be power of 2");

        // Primitive root of Goldilocks field
        uint256 primitiveRoot = 7;
        
        // ω = g^((p-1)/n) where g is primitive root, p is modulus, n is domain size
        uint256 exponent = (FIELD_MODULUS - 1) / domainSize;
        return _modExp(primitiveRoot, exponent, FIELD_MODULUS);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /**
     * @notice Modular exponentiation: base^exp mod modulus
     * @dev Uses binary exponentiation for efficiency
     */
    function _modExp(
        uint256 base,
        uint256 exp,
        uint256 modulus
    ) internal pure returns (uint256) {
        if (modulus == 0) revert FieldOverflow();
        
        uint256 result = 1;
        base = base % modulus;

        while (exp > 0) {
            if (exp % 2 == 1) {
                result = mulmod(result, base, modulus);
            }
            exp = exp / 2;
            base = mulmod(base, base, modulus);
        }
        return result;
    }

    /**
     * @notice Compute modular inverse using Fermat's little theorem
     * @dev a^(-1) = a^(p-2) mod p for prime p
     */
    function _modInverse(
        uint256 a,
        uint256 modulus
    ) internal pure returns (uint256) {
        require(a != 0, "Cannot invert zero");
        return _modExp(a, modulus - 2, modulus);
    }
}
