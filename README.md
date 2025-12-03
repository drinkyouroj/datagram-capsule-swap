# Datagram Capsule Swap

A decentralized application (dApp) allowing users to swap their Datagram Capsule NFTs for 25% of their value in DGRAM tokens.

## Architecture & Wallet Setup

This project uses a secure 4-wallet architecture to separate concerns and maximize security.

### 1. Wallet A: The Owner (Admin)
*   **Role:** Deploys the contract, manages settings (maintenance, treasury), and withdraws liquidity.
*   **Setup:** Use your primary secure wallet (e.g., MetaMask + Ledger).
*   **Funds Needed:** Yes (DGRAM for gas).
*   **Action:** Connects to `/admin` to manage the dApp.

### 2. Wallet B: The Signer (Backend)
*   **Role:** Cryptographically signs "coupons" on the server to authorize swaps.
*   **Setup:** Generate a NEW, FRESH wallet. Copy its Private Key into `.env.local`.
*   **Funds Needed:** No (0 DGRAM). It only signs messages off-chain; it never sends transactions.
*   **Security:** NEVER use this wallet for anything else.

### 3. Wallet C: The Treasury (Vault)
*   **Role:** Receives the Datagram Capsules from users.
*   **Setup:** Can be any address (e.g., your custodial Datagram account).
*   **Funds Needed:** No.
*   **Action:** Set this address in the Smart Contract constructor or via the Admin UI.

### 4. The Contract Address (Liquidity)
*   **Role:** Holds the DGRAM liquidity and pays users automatically.
*   **Setup:** This address is created when you deploy `CapsuleSwap.sol`.
*   **Funds Needed:** **YES.** You must send DGRAM to this address to fund the swaps.
*   **Action:** Monitor its balance in the Admin UI. If it runs out, users cannot swap.

## Deployment Guide

1.  **Setup Environment Variables:**
    Create `.env.local` and add the following:

    ```bash
    # Deployment & Admin
    DEPLOYER_PRIVATE_KEY=0x...  # Wallet A Private Key (Has DGRAM for gas)
    SIGNER_ADDRESS=0x...        # Wallet B Public Address
    TREASURY_ADDRESS=0x...      # Wallet C Public Address

    # Backend App
    ADMIN_PRIVATE_KEY=0x...     # Wallet B Private Key (For signing swaps)
    NEXT_PUBLIC_CONTRACT_ADDRESS= # Leave empty until deployed
    
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
    ```

2.  **Deploy Contract:**
    Run the deployment script:
    ```bash
    npx hardhat run scripts/deploy.js --network datagram
    ```

3.  **Finalize Config:**
    *   Copy the "CapsuleSwap deployed to: 0x..." address from the terminal.
    *   Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env.local`.
    *   **Fund the Contract:** Send DGRAM from Wallet A to this new Contract Address.

4.  **Run App:**
    ```bash
    npm run dev
    ```
