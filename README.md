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

## Deployment Steps

1.  **Deploy Contract:**
    *   Deploy `contracts/CapsuleSwap.sol` using Wallet A.
    *   Constructor Args:
        *   `_capsuleContract`: `0xC9Af289cd84864876b5337E3ef092B205f47d65F`
        *   `_signer`: Address of Wallet B.
        *   `_treasury`: Address of Wallet C.

2.  **Fund Contract:**
    *   Send DGRAM from Wallet A to the Deployed Contract Address.

3.  **Configure App:**
    *   Create `.env.local`:
        ```bash
        NEXT_PUBLIC_SUPABASE_URL=...
        SUPABASE_SERVICE_ROLE_KEY=...
        ADMIN_PRIVATE_KEY=... (Private Key of Wallet B)
        NEXT_PUBLIC_CONTRACT_ADDRESS=... (Address of Deployed Contract)
        ```

4.  **Run:**
    ```bash
    npm run dev
    ```
