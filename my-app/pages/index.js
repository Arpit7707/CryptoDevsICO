import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { BigNumber, Contract, providers, utils } from "ethers";
import {
  NFT_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
} from "../constants/index";

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  //the instance of web3modal using useRef will remain until the page is open(persist as long as user is on website)
  const web3ModalRef = useRef();

  //checking if CryptoDev nft holders has claimed token
  const [tokensToBeClaimed, settokensToBeClaimed] = useState(zero);

  const [loading, setLoading] = useState(false);

  //keeping track of amout of token user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);

  //keeping track of tokens user have minted
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);

  //keeping track of total numebr of tokens minted
  const [numTokenMinted, setNumTokenMinted] = useState(zero);

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    //actually this line connects to wallet
    const provider = await web3ModalRef.current.connect(); //metamask
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();

      //getting the instance of CryptoDevToken contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      //this time we need instance of nft contract to determine howmany token a user can claim on balance of nft it holds
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      //getting the balance of nft tokens
      const balance = await nftContract.balanceOf(address);

      if (balance == zero) {
        //balance is 0 means they don't have any nft and they don't have any claimable token so set settokensToBeClaimed to 0
        settokensToBeClaimed(zero);
      } else {
        //loop through list of addresses of nft holders and check if tokens are claimed by any address
        //if not claimed by address you increase amount and otherwise not ,for keeping track of howmany tokens are remaining for
        //claiming
        //computing that on frontend so we don't have to pay extra gas for checking of remaining amount of token for claiming
        //by smart contract
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          //we can get token id of nft hold by address and index
          //refer ERC721Enumeration contract for this function
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
          settokensToBeClaimed(BigNumber.from(amount));
        }
      }
    } catch (err) {
      console.error(err);
      settokensToBeClaimed(zero);
    }
  };

  const getBalanceOfCryptoDevsToken = async () => {
    try {
      const provider = await getProviderOrSigner();
      //getting the instance of CryptoDevToken contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
    }
  };

  const getTotalTokenMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      //getting the instance of CryptoDevToken contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const _tokenMinted = await tokenContract.totalSupply();
      setNumTokenMinted(_tokenMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const mintCryptoDevToken = async (amount) => {
    try {
      //signer is needed coz to mint token user needs to sign transaction
      const signer = await getProviderOrSigner(true);

      //getting the instance of CryptoDevToken contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount; //amount is number
      //converting the amount into string coz parseEther accepts string
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted Crypto Devs Token");

      //updating state variables by calling these functions
      await getBalanceOfCryptoDevsToken();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      //getting the instance of CryptoDevToken contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully Claimed Crypto Dev Token");

      //updating state variables by calling these functions
      await getBalanceOfCryptoDevsToken();
      await getTotalTokenMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      //updating state variables by calling these function
      getBalanceOfCryptoDevsToken();
      getTotalTokenMinted();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // if (tokensToBeClaimed) {
    //   return (
    //     <div>
    //       <div className={styles.description}>
    //         {/* multiplying 10 with amount of token to be claimed because per nft user can mint 10 tokens (according to policy) */}
    //         {tokensToBeClaimed * 10} Token can be claimed!
    //       </div>
    //       <button className={styles.button} onClick={claimCryptoDevTokens}>
    //         Claim Tokens
    //       </button>
    //     </div>
    //   );
    // }
    // If user doesnt have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of token "
            onChange={(e) => {
              setTokenAmount(BigNumber.from(e.target.value));
            }}
          />
          <button
            className={styles.button}
            disabled={!(tokenAmount > 0)}
            onClick={() => {
              mintCryptoDevToken(tokenAmount);
            }}
          >
            Mint Tokens!
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs ICO</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* formatEther() converts bignumber to string */}
                You have minted {utils.formatEther(
                  balanceOfCryptoDevTokens
                )}{" "}
                Crypto Dev Tokens!
              </div>

              <div className={styles.description}>
                {/* formatEther() converts bignumber to string */}
                Overall {utils.formatEther(numTokenMinted)}/10000 have been
                minted!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect Your Wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Arpit</footer>
    </div>
  );
}

//<----------------steps to create this file-------------------->

//when user enters let them connect to wallet
//{declare connecWallet(also add it in dependencies array) state variable, use useEffect hook to perform connectWallet()
// function if wallet is not connected,
//declare useRef() hook and instantiate it brfore calling connectWallet() funcion
//make button for, then make
//then we need to declare and write getProviderOrSigner() function in which avtually wallet connection happens}

//then user should get to know howmany of totalsupply of token have been already minted and howmany user has minted
//{fot this declare numTokenMinted state variable and balanceOfCryptoDevTokens and initialize both with 0}

//create renderButton() function to let users interact with website according to state of user using state variables

//1st in renderButton()
//{create a flexbox, first element of flexbox is input by which user can enter the amount of token it want to mint
//for keeping track of this declare tokenAmount state variable and make onChange function for input to set tokenAmount
//create mint token button(the mint token button wll be diasbled if user haven't entered tokenAmount),
//create mintToken() function which takes tokenAmount as parameter, in that function create contract instance,
//while minting the token we want to show that transactio is loading so we declare loading state variable,
//create getBalanceOfCryptoDevsToken() and getTotalTokenMinted() in mintToken() so that state variables an be updtaed and
//new values of numTokenMinted and balanceOfCryptoDevTokens can be updated on UI,
//}

//2nd in renderButton()
//{we need to check if CryptoDev nft holder have claimed the token i.e. performing "claim" functionality of contract:->{
//call getTokensToBeClaimed() in mintToken() after minting token for getting most updated value because and it will updated on UI
//after every minting, creat button to actually claim the token and create claimCryptoDevTokens() function to claim it}}

//calling these three getBalanceOfCryptoDevsToken(), getTotalTokenMinted() ,getTokensToBeClaimed() functions so that
//we can see all values when first page loads
