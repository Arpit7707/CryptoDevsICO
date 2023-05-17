const { ethers } = require("hardhat")
require("dotenv").config({ path: ".env" })
const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants/index")

async function main() {
  const cryptoDevsTokenContract = await ethers.getContractFactory(
    "CryptoDevToken"
  )
  const deployCryptoDevTokenContract = await cryptoDevsTokenContract.deploy(
    CRYPTO_DEVS_NFT_CONTRACT_ADDRESS
  )
  console.log(
    "CryptoDevToken contract address",
    deployCryptoDevTokenContract.address
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
