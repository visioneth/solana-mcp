# Solana MCP Server

A production-grade [Model Context Protocol](https://modelcontextprotocol.io) server for interacting with the Solana blockchain. Gives AI agents (Claude, Cursor, etc.) the ability to read chain data, execute transactions, swap tokens, manage wallets, and more.

**38 tools** across 7 modules: Wallet, SPL Tokens, DeFi, NFT, Programs, Analytics, Network.

## Quick Start

```bash
npx @visioneth/solana-mcp@latest
```

### Claude Desktop / Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "solana-mcp": {
      "command": "npx",
      "args": ["-y", "@visioneth/solana-mcp@latest"],
      "env": {
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

For write operations (transfers, swaps, minting), add your private key:

```json
{
  "env": {
    "PRIVATE_KEY": "your_base58_private_key",
    "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
  }
}
```

### SSE Mode (Remote)

```bash
npx @visioneth/solana-mcp@latest --sse
# Server starts on http://localhost:3001
```

## Tools

### Wallet (7 tools)
| Tool | Description |
|------|-------------|
| `get_balance` | SOL balance of any address |
| `get_account_info` | Detailed account info |
| `transfer_sol` | Send SOL |
| `request_airdrop` | Test SOL on devnet/testnet |
| `get_transaction` | Transaction details by signature |
| `get_recent_transactions` | Recent transactions for an address |
| `get_wallet_address` | Public key from configured private key |

### SPL Tokens (7 tools)
| Tool | Description |
|------|-------------|
| `get_token_balance` | Token balance for a wallet |
| `get_token_info` | Mint info (supply, decimals, authorities) |
| `get_token_accounts` | All token holdings |
| `create_token` | Create new SPL token |
| `mint_tokens` | Mint tokens to an address |
| `transfer_token` | Transfer SPL tokens |
| `burn_tokens` | Burn SPL tokens |

### DeFi (4 tools)
| Tool | Description |
|------|-------------|
| `get_token_price` | USD price via Jupiter |
| `get_swap_quote` | Jupiter swap quote with routing |
| `execute_swap` | Execute swap on Jupiter |
| `get_stake_accounts` | Staking info for a wallet |

### NFT (3 tools)
| Tool | Description |
|------|-------------|
| `get_nft_metadata` | On-chain NFT metadata |
| `get_nfts_by_owner` | All NFTs in a wallet |
| `get_nft_collection_info` | Collection info from sample NFT |

### Programs (4 tools)
| Tool | Description |
|------|-------------|
| `is_program` | Check if address is executable |
| `get_program_accounts` | Accounts owned by a program |
| `read_account_data` | Raw account data |
| `identify_program` | Look up known programs |

### Analytics (5 tools)
| Tool | Description |
|------|-------------|
| `get_tps` | Current transactions per second |
| `get_largest_token_holders` | Top holders of any token |
| `get_token_supply` | Total supply info |
| `get_sol_price` | Current SOL price in USD |
| `get_largest_accounts` | Biggest SOL holders |

### Network (8 tools)
| Tool | Description |
|------|-------------|
| `get_epoch_info` | Current epoch and progress |
| `get_slot` | Current slot number |
| `get_block_height` | Current block height |
| `get_block` | Block details by slot |
| `get_cluster_nodes` | Validator/node info |
| `get_supply` | Total and circulating SOL |
| `get_minimum_balance_for_rent` | Rent exemption calculator |
| `get_health` | RPC node health check |

## Prompts

Built-in prompts for common workflows:

- `analyze_wallet` — Full wallet analysis
- `inspect_transaction` — Transaction deep-dive
- `analyze_token` — Token due diligence with risk score
- `portfolio_check` — All holdings summary
- `swap_analysis` — Pre-swap analysis
- `analyze_nft` — NFT metadata analysis
- `analyze_program` — Program investigation
- `token_research` — Comprehensive token research
- `network_health` — Network status dashboard
- `solana_overview` — Full network overview

## Safety

- **Write operations require explicit network specification** — the server will never default to mainnet for transactions
- **Private key only needed for writes** — read-only tools work without credentials
- Confirmation prompts before executing state-changing operations
- All amounts use human-readable UI values (not raw lamports)

## Development

```bash
git clone https://github.com/visioneth/solana-mcp.git
cd solana-mcp
npm install
cp .env.example .env
npm run dev        # stdio mode
npm run dev:sse    # SSE mode
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | For writes | Base58-encoded Solana private key |
| `SOLANA_RPC_URL` | No | Custom RPC endpoint (defaults to mainnet-beta) |
| `LOG_LEVEL` | No | DEBUG, INFO, WARN, ERROR (default INFO) |
| `PORT` | No | SSE server port (default 3001) |

## Supported Networks

- **mainnet-beta** — Production (real funds)
- **devnet** — Development and testing
- **testnet** — Validator testing

## License

MIT
