import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

export function registerNftTools(server: McpServer) {
  server.tool(
    "get_nft_metadata",
    "Get on-chain metadata for an NFT by its mint address",
    {
      mint_address: z.string().describe("NFT mint address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const mint = new PublicKey(mint_address);
        const metadataPDA = getMetadataPDA(mint);

        const accountInfo = await connection.getAccountInfo(metadataPDA);

        if (!accountInfo) {
          return mcpResponse.error(
            `No metadata found for mint: ${mint_address}`
          );
        }

        // Parse metadata account data
        const data = accountInfo.data;

        // Skip: key (1) + update authority (32) + mint (32) = 65 bytes
        let offset = 65;

        // Read name (4 bytes length + string)
        const nameLen = data.readUInt32LE(offset);
        offset += 4;
        const name = data
          .subarray(offset, offset + nameLen)
          .toString("utf8")
          .replace(/\0/g, "");
        offset += nameLen;

        // Read symbol (4 bytes length + string)
        const symbolLen = data.readUInt32LE(offset);
        offset += 4;
        const symbol = data
          .subarray(offset, offset + symbolLen)
          .toString("utf8")
          .replace(/\0/g, "");
        offset += symbolLen;

        // Read uri (4 bytes length + string)
        const uriLen = data.readUInt32LE(offset);
        offset += 4;
        const uri = data
          .subarray(offset, offset + uriLen)
          .toString("utf8")
          .replace(/\0/g, "");

        const updateAuthority = new PublicKey(data.subarray(1, 33)).toBase58();

        return mcpResponse.success({
          mint: mint_address,
          name: name.trim(),
          symbol: symbol.trim(),
          uri: uri.trim(),
          update_authority: updateAuthority,
          metadata_address: metadataPDA.toBase58(),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_nft_metadata failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_nfts_by_owner",
    "Get all NFTs owned by a wallet address",
    {
      wallet_address: z.string().describe("Wallet address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ wallet_address, network }) => {
      try {
        const connection = getConnection(network);
        const wallet = new PublicKey(wallet_address);

        // Get all token accounts with amount = 1 (likely NFTs)
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet,
          { programId: TOKEN_PROGRAM_ID }
        );

        const nfts = tokenAccounts.value
          .filter((ta) => {
            const info = ta.account.data.parsed.info;
            return (
              info.tokenAmount.uiAmount === 1 &&
              info.tokenAmount.decimals === 0
            );
          })
          .map((ta) => {
            const info = ta.account.data.parsed.info;
            return {
              mint: info.mint,
              token_account: ta.pubkey.toBase58(),
            };
          });

        return mcpResponse.success({
          wallet: wallet_address,
          nft_count: nfts.length,
          nfts,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_nfts_by_owner failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_nft_collection_info",
    "Get info about an NFT collection by checking a sample NFT from the collection",
    {
      mint_address: z
        .string()
        .describe("Mint address of any NFT in the collection"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const mint = new PublicKey(mint_address);
        const metadataPDA = getMetadataPDA(mint);

        const accountInfo = await connection.getAccountInfo(metadataPDA);

        if (!accountInfo) {
          return mcpResponse.error(`No metadata found for: ${mint_address}`);
        }

        const data = accountInfo.data;

        // Parse basic metadata
        let offset = 65;
        const nameLen = data.readUInt32LE(offset);
        offset += 4;
        const name = data
          .subarray(offset, offset + nameLen)
          .toString("utf8")
          .replace(/\0/g, "");
        offset += nameLen;

        const symbolLen = data.readUInt32LE(offset);
        offset += 4;
        const symbol = data
          .subarray(offset, offset + symbolLen)
          .toString("utf8")
          .replace(/\0/g, "");
        offset += symbolLen;

        const uriLen = data.readUInt32LE(offset);
        offset += 4;
        const uri = data
          .subarray(offset, offset + uriLen)
          .toString("utf8")
          .replace(/\0/g, "");

        // Try to fetch off-chain metadata for collection info
        let offChainData = null;
        const trimmedUri = uri.trim();
        if (trimmedUri && trimmedUri.startsWith("http")) {
          try {
            const res = await fetch(trimmedUri);
            offChainData = await res.json();
          } catch {
            // Off-chain metadata unavailable
          }
        }

        return mcpResponse.success({
          sample_mint: mint_address,
          name: name.trim(),
          symbol: symbol.trim(),
          uri: trimmedUri,
          collection: (offChainData as any)?.collection || null,
          attributes: (offChainData as any)?.attributes || null,
          image: (offChainData as any)?.image || null,
          description: (offChainData as any)?.description || null,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_nft_collection_info failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );
}
