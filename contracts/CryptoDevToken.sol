//SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    ICryptoDevs CryptoDevsNFT;
    uint256 public constant tokenPrice = 0.001 ether;

    // Each NFT would give the user 10 tokens
    // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
    // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
    // is actually equal to (10 ^ -18) tokens.
    // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
    // More information on this can be found in the Freshman Track Cryptocurrency tutorial.
    uint256 public constant tokensPerNFT = 10 * 10 ** 18; //10 CD tokens

    // the max total supply is 10000 for Crypto Dev Tokens
    uint256 public constant maxTotalSupply = 10000 * 10 ** 18;

    //keeping track of token is claimed by any address using it's tokenId
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    /**
     * @dev Mints `amount` number of CryptoDevTokens
     * Requirements:
     * - `msg.value` should be equal or greater than the tokenPrice * amount
     */
    function mint(uint256 amount) public payable {
        //amount of ethers(money)(atleast) sender should have to buy amount of token it wanted which is passed in parameter
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ethers sent is lesser");
        uint256 amountWithDecimals = amount * 1 ** 18; //convering amount in bignumber coz mint function accepts it that way
        require(
            totalSupply() + amountWithDecimals <= maxTotalSupply,
            "Exceeds the max total supply available."
        );
        // call the internal function from Openzeppelin's ERC20 contract
        _mint(msg.sender, amountWithDecimals);
    }

    /**
     * @dev Mints tokens based on the number of NFT's held by the sender
     * Requirements:
     * balance of Crypto Dev NFT's owned by the sender should be greater than 0
     * Tokens should have not been claimed for all the NFTs owned by the sender
     */
    //senders who owns nft from CryptoDevs can claim CryptoDevsToken coins
    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender); //checking the nft balance of sender from cryptodevs nft contract
        require(balance > 0, "You don't own any CryptoDev NFTs");
        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            //getting tokenId of NFT which sender owns from CryptoDevNFT contract
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            //if any tokenId is not claimed then only this conditional will be executed
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        //if amount is 0 then conditional is not executed and that means tokens are claimed
        require(amount > 0, "You have already claimed all your tokens");
        _mint(msg.sender, amount * tokensPerNFT);
    }

    // Enables withdrawal of ether sent to contract for ICO
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}

//0x04F7831FcB6ca8f81E310e1EF83ce04C9049d246
