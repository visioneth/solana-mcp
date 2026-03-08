# Solana MCP Tools Reference

## Wallet Tools

### get_balance
Get the SOL balance of a Solana wallet address.
- `address` (string, required): Solana wallet address (base58)
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_account_info
Get detailed account information including owner, lamports, data size, and executable status.
- `address` (string, required): Solana wallet or account address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### transfer_sol
Transfer SOL from the configured wallet to a destination address. **Requires PRIVATE_KEY.**
- `to_address` (string, required): Destination Solana address
- `amount_sol` (number, required): Amount of SOL to transfer
- `network` (enum, **required**): MUST be specified — never defaults to mainnet

### request_airdrop
Request a SOL airdrop on devnet or testnet.
- `address` (string, required): Solana address to receive airdrop
- `amount_sol` (number, required): Amount (max 2 SOL)
- `network` (enum, required): devnet | testnet only

### get_transaction
Get details of a Solana transaction by its signature.
- `signature` (string, required): Transaction signature (base58)
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_recent_transactions
Get recent transaction signatures for a Solana address.
- `address` (string, required): Solana wallet address
- `limit` (number, optional): 1-50 (default 10)
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_wallet_address
Get the public wallet address from the configured PRIVATE_KEY. No parameters.

---

## SPL Token Tools

### get_token_balance
Get the SPL token balance of a wallet for a specific token mint.
- `wallet_address` (string, required): Wallet address
- `mint_address` (string, required): SPL token mint address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_token_info
Get metadata and supply info for an SPL token.
- `mint_address` (string, required): SPL token mint address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_token_accounts
Get all SPL token accounts owned by a wallet.
- `wallet_address` (string, required): Wallet address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### create_token
Create a new SPL token mint. **Requires PRIVATE_KEY.**
- `decimals` (number, optional): 0-9 (default 9)
- `network` (enum, **required**): MUST be specified

### mint_tokens
Mint SPL tokens to a destination wallet. **Requires PRIVATE_KEY with mint authority.**
- `mint_address` (string, required): Token mint address
- `to_address` (string, required): Destination wallet
- `amount` (number, required): UI amount to mint
- `network` (enum, **required**): MUST be specified

### transfer_token
Transfer SPL tokens. **Requires PRIVATE_KEY.**
- `mint_address` (string, required): Token mint address
- `to_address` (string, required): Destination wallet
- `amount` (number, required): UI amount to transfer
- `network` (enum, **required**): MUST be specified

### burn_tokens
Burn SPL tokens. **Requires PRIVATE_KEY.**
- `mint_address` (string, required): Token mint address
- `amount` (number, required): UI amount to burn
- `network` (enum, **required**): MUST be specified

---

## DeFi Tools

### get_token_price
Get the current USD price of a Solana token via Jupiter.
- `mint_address` (string, required): Token mint or 'SOL'

### get_swap_quote
Get a swap quote from Jupiter DEX aggregator.
- `input_mint` (string, required): Input token mint or 'SOL'
- `output_mint` (string, required): Output token mint or 'SOL'
- `amount` (number, required): UI amount of input token
- `slippage_bps` (number, optional): Slippage in basis points (default 50 = 0.5%)

### execute_swap
Execute a token swap on Jupiter. **Requires PRIVATE_KEY.** Mainnet only.
- `input_mint` (string, required): Input token mint or 'SOL'
- `output_mint` (string, required): Output token mint or 'SOL'
- `amount` (number, required): UI amount of input token
- `slippage_bps` (number, optional): Slippage in basis points
- `network` (enum, **required**): Must be mainnet-beta

### get_stake_accounts
Get all stake accounts for a Solana wallet.
- `wallet_address` (string, required): Wallet address
- `network` (enum, optional): mainnet-beta | devnet | testnet

---

## NFT Tools

### get_nft_metadata
Get on-chain metadata for an NFT.
- `mint_address` (string, required): NFT mint address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_nfts_by_owner
Get all NFTs owned by a wallet.
- `wallet_address` (string, required): Wallet address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_nft_collection_info
Get collection info from a sample NFT including off-chain metadata.
- `mint_address` (string, required): Any NFT mint from the collection
- `network` (enum, optional): mainnet-beta | devnet | testnet

---

## Program Tools

### is_program
Check if a Solana address is an executable program.
- `address` (string, required): Solana address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_program_accounts
Get accounts owned by a program.
- `program_id` (string, required): Program address
- `data_size` (number, optional): Filter by data size in bytes
- `limit` (number, optional): Max results 1-100 (default 20)
- `network` (enum, optional): mainnet-beta | devnet | testnet

### read_account_data
Read raw account data.
- `address` (string, required): Account address
- `encoding` (enum, optional): base64 | base58 | jsonParsed
- `network` (enum, optional): mainnet-beta | devnet | testnet

### identify_program
Look up a well-known Solana program by address.
- `address` (string, required): Program address

---

## Analytics Tools

### get_tps
Get current transactions per second.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_largest_token_holders
Get the largest holders of an SPL token.
- `mint_address` (string, required): Token mint address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_token_supply
Get total and circulating supply of an SPL token.
- `mint_address` (string, required): Token mint address
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_sol_price
Get current SOL price in USD via Jupiter. No parameters.

### get_largest_accounts
Get the largest SOL-holding accounts on the network.
- `filter` (enum, optional): circulating | nonCirculating
- `network` (enum, optional): mainnet-beta | devnet | testnet

---

## Network Tools

### get_epoch_info
Get current epoch information.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_slot
Get the current slot number.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_block_height
Get the current block height.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_block
Get block details by slot number.
- `slot` (number, required): Slot number
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_cluster_nodes
Get info about all nodes in the cluster.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_supply
Get total SOL supply and circulation info.
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_minimum_balance_for_rent
Calculate minimum SOL for rent exemption.
- `data_size` (number, required): Account data size in bytes
- `network` (enum, optional): mainnet-beta | devnet | testnet

### get_health
Check RPC node health.
- `network` (enum, optional): mainnet-beta | devnet | testnet
