// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPYUSD
 * @dev Interface for the PYUSD (PayPal USD) ERC-20 token on Sepolia testnet
 * @notice PYUSD uses 6 decimals (not 18 like most ERC-20 tokens)
 * 
 * Token Address on Sepolia: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
 * 
 * Important: When working with PYUSD amounts:
 * - 1 PYUSD = 1,000,000 (6 decimals)
 * - 10.50 PYUSD = 10,500,000
 * - Always use 6 decimal places in calculations
 */
interface IPYUSD {
    /**
     * @dev Returns the total token supply
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the token balance of an account
     * @param account The address to query the balance of
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Transfers tokens from caller to recipient
     * @param recipient The address to transfer to
     * @param amount The amount to transfer (in 6 decimals)
     * @return bool indicating success
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining allowance that spender can spend on behalf of owner
     * @param owner The address that owns the tokens
     * @param spender The address that can spend the tokens
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets the allowance of spender over the caller's tokens
     * @param spender The address that will be allowed to spend tokens
     * @param amount The amount of tokens to allow (in 6 decimals)
     * @return bool indicating success
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Transfers tokens from sender to recipient using the allowance mechanism
     * @param sender The address to transfer from
     * @param recipient The address to transfer to
     * @param amount The amount to transfer (in 6 decimals)
     * @return bool indicating success
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Returns the number of decimals used by the token
     * @return uint8 The number of decimals (should be 6 for PYUSD)
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Returns the token name
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token symbol
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Emitted when tokens are transferred
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param value The amount of tokens transferred
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when allowance is set
     * @param owner The address that owns the tokens
     * @param spender The address that is approved to spend
     * @param value The allowance amount
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

