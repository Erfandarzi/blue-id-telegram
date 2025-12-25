/**
 * Blue ID SBT Deployment Script
 * 
 * To deploy:
 * 1. Go to https://ide.ton.org
 * 2. Paste the BlueIdSbt.fc contract
 * 3. Compile and deploy to mainnet/testnet
 * 4. Copy the deployed contract address
 * 5. Update MINT_CONTRACT_ADDRESS in src/App.jsx
 * 
 * Alternative: Use TON Blueprint
 * npm install @ton/blueprint @ton/core @ton/crypto
 * npx blueprint build
 * npx blueprint run
 */

import { beginCell, Address, toNano } from '@ton/core';

// SBT Item initial data
export function buildSbtItemData(
  ownerAddress: Address,
  authority: Address,
  content: string
) {
  const contentCell = beginCell()
    .storeStringTail(content)
    .endCell();

  return beginCell()
    .storeAddress(ownerAddress)
    .storeRef(contentCell)
    .storeAddress(authority)
    .storeUint(0, 64) // revoked_at = 0 (not revoked)
    .endCell();
}

// Message to mint new SBT to user
export function buildMintMessage(
  userAddress: Address,
  itemIndex: bigint,
  content: string
) {
  return beginCell()
    .storeUint(1, 32) // op: mint
    .storeUint(0, 64) // query_id
    .storeUint(itemIndex, 64)
    .storeCoins(toNano('0.05')) // forward amount
    .storeRef(
      beginCell()
        .storeAddress(userAddress)
        .storeRef(beginCell().storeStringTail(content).endCell())
        .endCell()
    )
    .endCell();
}

console.log(`
=== Blue ID SBT Deployment ===

Easiest path:
1. Open https://ide.ton.org
2. Create new project
3. Paste contracts/BlueIdSbt.fc
4. Click "Compile" then "Deploy"
5. Use testnet first (free TON from @testgiver_ton_bot)
6. Copy deployed address to frontend

Contract address will look like: EQ...
`);

