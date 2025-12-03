require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    datagram: {
      url: "https://mainnet.datagram.network/rpc",
      chainId: 968,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
};
