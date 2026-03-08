# Solana MCP Skill

This skill teaches AI agents how to interact with the Solana blockchain using the Solana MCP Server.

## Setup

Add this to your MCP client configuration (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "solana-mcp": {
      "command": "npx",
      "args": ["-y", "@visioneth/solana-mcp@latest"],
      "env": {
        "PRIVATE_KEY": "your_base58_private_key_here",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

**PRIVATE_KEY** is only required for write operations (transfers, swaps, minting). Read-only tools work without it.

## Safety Rules

### CRITICAL: Network Specification for Write Operations
For ANY state-changing tool (transfer_sol, transfer_token, execute_swap, create_token, mint_tokens, burn_tokens):
- **You MUST ask the user which network to use if they haven't specified one**
- **NEVER default to mainnet-beta for write operations**
- Defaulting to mainnet risks irreversible financial loss
- Read-only tools may default to mainnet-beta

### Transaction Confirmation
- Always show the user what will happen before executing a write operation
- Display: amount, destination, network, and estimated fees
- Wait for explicit user confirmation

## Available Tools

### Wallet (7 tools)
- `get_balance` — Get SOL balance of any address
- `get_account_info` — Get detailed account info (owner, data size, executable)
- `transfer_sol` — Send SOL to an address (requires PRIVATE_KEY)
- `request_airdrop` — Get test SOL on devnet/testnet
- `get_transaction` — Get transaction details by signature
- `get_recent_transactions` — Get recent transactions for an address
- `get_wallet_address` — Get the public key from configured PRIVATE_KEY

### SPL Tokens (7 tools)
- `get_token_balance` — Check token balance for a wallet
- `get_token_info` — Get mint info (decimals, supply, authorities)
- `get_token_accounts` — List all token holdings for a wallet
- `create_token` — Create a new SPL token mint
- `mint_tokens` — Mint tokens to an address
- `transfer_token` — Transfer SPL tokens
- `burn_tokens` — Burn SPL tokens

### DeFi (4 tools)
- `get_token_price` — Get USD price via Jupiter
- `get_swap_quote` — Get a Jupiter swap quote with routing info
- `execute_swap` — Execute a token swap on Jupiter
- `get_stake_accounts` — Get staking info for a wallet

### NFT (3 tools)
- `get_nft_metadata` — Get on-chain NFT metadata
- `get_nfts_by_owner` — List all NFTs owned by a wallet
- `get_nft_collection_info` — Get collection info from a sample NFT

### Programs (4 tools)
- `is_program` — Check if an address is an executable program
- `get_program_accounts` — Get accounts owned by a program
- `read_account_data` — Read raw account data
- `identify_program` — Look up well-known Solana programs

### Analytics (5 tools)
- `get_tps` — Current transactions per second
- `get_largest_token_holders` — Top holders of any SPL token
- `get_token_supply` — Total supply info
- `get_sol_price` — Current SOL price in USD
- `get_largest_accounts` — Biggest SOL-holding accounts

### Network (8 tools)
- `get_epoch_info` — Current epoch, slot, progress
- `get_slot` — Current slot number
- `get_block_height` — Current block height
- `get_block` — Block details by slot
- `get_cluster_nodes` — Validator/node info
- `get_supply` — Total and circulating SOL supply
- `get_minimum_balance_for_rent` — Calculate rent exemption
- `get_health` — RPC node health check

## Prompts

- `analyze_wallet` — Full wallet analysis (balance, activity, patterns)
- `inspect_transaction` — Transaction deep-dive
- `analyze_token` — Token supply, authorities, rug pull risk
- `portfolio_check` — All holdings for a wallet
- `swap_analysis` — Pre-swap analysis with price impact
- `analyze_nft` — NFT metadata and collection analysis
- `analyze_program` — Program investigation
- `token_research` — Full token due diligence with risk score
- `network_health` — Solana network status dashboard
- `solana_overview` — Comprehensive network overview

## Networks

| Network | Use Case |
|---------|----------|
| mainnet-beta | Production (real funds) |
| devnet | Development and testing |
| testnet | Validator testing |

## Common Workflows

### Check a wallet
1. `get_balance` → SOL balance
2. `get_token_accounts` → All token holdings
3. `get_recent_transactions` → Recent activity

### Research a token
1. `get_token_info` → Supply, decimals, authorities
2. `get_token_price` → Current USD price
3. `get_largest_token_holders` → Distribution
4. Assess risk based on concentration and authorities

### Execute a swap
1. `get_token_price` → Check current prices
2. `get_swap_quote` → Preview the swap
3. Confirm with user → Show price impact
4. `execute_swap` → Execute if approved
