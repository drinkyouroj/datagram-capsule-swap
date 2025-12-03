# How to Swap Your Datagram Capsule for DGRAM

This guide explains how to check your Capsule's value and swap it for instant DGRAM liquidity using the Capsule Swap platform.

You can swap in two ways:
1.  **Web Swap:** Connect your wallet to our website.
2.  **Manual Transfer:** Send the Capsule directly from your Datagram Dashboard.

---

## Step 1: Check Your Capsule Value & Contract Liquidity

Before sending anything, verify how much DGRAM you will receive and ensure the contract has enough funds to pay you.

1.  **Find your Capsule ID:**
    *   Log in to your [Datagram Dashboard](https://datagram.network).
    *   Go to the **Rewards** or **Capsules** tab.
    *   Look for the **Capsule ID** (e.g., `3130187969`) next to your capsule.

2.  **Check Value on Capsule Swap:**
    *   Go to the [Capsule Swap Website](https://datagram-capsule-swap.vercel.app).
    *   Enter your **Capsule ID** in the search box and click **"Check Value"**.
    *   You will see two numbers:
        *   **Total Value:** The full vesting value of the capsule.
        *   **You Receive (25%):** The amount of liquid DGRAM you get immediately.

3.  **Verify Liquidity:**
    *   Look at the result card.
    *   **If the text is Green:** The contract has enough DGRAM to pay you. You can proceed.
    *   **If you see a Yellow Warning:** *"The contract currently has insufficient liquidity..."* — **STOP.** Do not send your capsule. Wait for the contract to be refilled.

---

## Step 2: Swap Your Capsule

### Option A: Swap via Website (Recommended for MetaMask users)
If your capsule is in a wallet like MetaMask:
1.  Click **"Connect Wallet"** on the Capsule Swap website.
2.  After checking your ID, click the blue **"Swap Now"** button.
3.  Approve the transaction in your wallet. The swap happens instantly in one transaction.

### Option B: Manual Transfer (For Datagram Dashboard users)
If your capsule is locked in the Datagram Dashboard (as shown in your screenshots), use this method.

1.  **Locate the Capsule:**
    *   In your Datagram Dashboard, find the capsule you want to swap.
    *   Click the **"Send"** button next to it.

2.  **Read the Warning:**
    *   A popup will appear warning you to only send to supported wallets.
    *   Check the box *"I have read and understand..."* and click **Continue**.

3.  **Enter Destination Address:**
    *   **IMPORTANT:** You must send the capsule to our **Treasury Address**.
    *   Copy this address exactly:
        ```
        0x0de730684c2a11d4c1eb08f8676fc9f1b822220e
        ```
    *   Paste it into the **"Enter Wallet"** field on the Datagram Dashboard.

4.  **Confirm Transfer:**
    *   The dashboard will show the estimated gas fee (e.g., ~0.6 DGRAM).
    *   Click **"Next"** and then **"Transfer capsule"**.

5.  **Receive Payment:**
    *   Our automated bot watches the blockchain 24/7.
    *   As soon as your transfer is confirmed on the blockchain, the contract will **automatically send the DGRAM payout** back to your sending wallet.
    *   You can view the transaction on the [Datagram Explorer](https://explorer.datagram.network).

---

**Need Help?**
If you sent a capsule but didn't receive payment within 5 minutes, check the transaction on the explorer to ensure it went to the correct Treasury Address (`0x0de...220e`).

