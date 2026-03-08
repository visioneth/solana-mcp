import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getConnection, getKeypair } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

const JUPITER_API = "https://quote-api.jup.ag/v6";

export function registerDefiTools(server: McpServer) {
  server.tool(
    "get_token_price",
    "Get the current USD price of a Solana token using Jupiter price API",
    {
      mint_address: z
        .string()
        .describe("Token mint address (or 'SOL' for native SOL)"),
    },
    async ({ mint_address }) => {
      try {
        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const id = mint_address === "SOL" ? SOL_MINT : mint_address;

        const response = await fetch(
          `https://api.jup.ag/price/v2?ids=${id}`
        );
        const data = (await response.json()) as any;

        if (!data.data?.[id]) {
          return mcpResponse.error(`Price not found for ${mint_address}`);
        }

        const priceData = data.data[id];
        return mcpResponse.success({
          mint: mint_address,
          price_usd: priceData.price,
          type: priceData.type,
        });
      } catch (error: any) {
        logger.error("get_token_price failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_swap_quote",
    "Get a swap quote from Jupiter DEX aggregator",
    {
      input_mint: z
        .string()
        .describe("Input token mint address (or 'SOL' for native SOL)"),
      output_mint: z
        .string()
        .describe("Output token mint address (or 'SOL' for native SOL)"),
      amount: z.number().positive().describe("Amount of input token (UI amount)"),
      slippage_bps: z
        .number()
        .int()
        .min(1)
        .max(5000)
        .optional()
        .describe("Slippage tolerance in basis points (default 50 = 0.5%)"),
    },
    async ({ input_mint, output_mint, amount, slippage_bps }) => {
      try {
        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const inMint = input_mint === "SOL" ? SOL_MINT : input_mint;
        const outMint = output_mint === "SOL" ? SOL_MINT : output_mint;

        // Get decimals for input token
        let decimals = 9; // default SOL
        if (inMint !== SOL_MINT) {
          const connection = getConnection();
          const mintPk = new PublicKey(inMint);
          const { getMint } = await import("@solana/spl-token");
          const mintInfo = await getMint(connection, mintPk);
          decimals = mintInfo.decimals;
        }

        const rawAmount = Math.round(amount * Math.pow(10, decimals));

        const params = new URLSearchParams({
          inputMint: inMint,
          outputMint: outMint,
          amount: rawAmount.toString(),
          slippageBps: (slippage_bps || 50).toString(),
        });

        const response = await fetch(`${JUPITER_API}/quote?${params}`);
        const quote = (await response.json()) as any;

        if (quote.error) {
          return mcpResponse.error(quote.error);
        }

        // Get output decimals
        let outDecimals = 9;
        if (outMint !== SOL_MINT) {
          const connection = getConnection();
          const mintPk = new PublicKey(outMint);
          const { getMint } = await import("@solana/spl-token");
          const mintInfo = await getMint(connection, mintPk);
          outDecimals = mintInfo.decimals;
        }

        const outAmount =
          Number(quote.outAmount) / Math.pow(10, outDecimals);

        return mcpResponse.success({
          input_mint: input_mint,
          output_mint: output_mint,
          input_amount: amount,
          output_amount: outAmount,
          price_impact_pct: quote.priceImpactPct,
          slippage_bps: slippage_bps || 50,
          route_plan: quote.routePlan?.map((r: any) => ({
            swap: r.swapInfo?.label,
            in_amount: r.swapInfo?.inAmount,
            out_amount: r.swapInfo?.outAmount,
          })),
          minimum_received:
            Number(quote.otherAmountThreshold) / Math.pow(10, outDecimals),
        });
      } catch (error: any) {
        logger.error("get_swap_quote failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "execute_swap",
    "Execute a token swap on Jupiter DEX aggregator. Requires PRIVATE_KEY.",
    {
      input_mint: z
        .string()
        .describe("Input token mint address (or 'SOL')"),
      output_mint: z
        .string()
        .describe("Output token mint address (or 'SOL')"),
      amount: z.number().positive().describe("Amount of input token (UI amount)"),
      slippage_bps: z
        .number()
        .int()
        .min(1)
        .max(5000)
        .optional()
        .describe("Slippage tolerance in basis points (default 50 = 0.5%)"),
      network: z
        .enum(["mainnet-beta", "devnet"])
        .describe("Network — MUST be specified"),
    },
    async ({ input_mint, output_mint, amount, slippage_bps, network }) => {
      try {
        if (!network) {
          return mcpResponse.error("Network must be explicitly specified for swaps.");
        }
        if (network !== "mainnet-beta") {
          return mcpResponse.error(
            "Jupiter swaps are only available on mainnet-beta."
          );
        }

        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const inMint = input_mint === "SOL" ? SOL_MINT : input_mint;
        const outMint = output_mint === "SOL" ? SOL_MINT : output_mint;

        const keypair = getKeypair();
        const connection = getConnection(network);

        // Get input decimals
        let decimals = 9;
        if (inMint !== SOL_MINT) {
          const mintPk = new PublicKey(inMint);
          const { getMint } = await import("@solana/spl-token");
          const mintInfo = await getMint(connection, mintPk);
          decimals = mintInfo.decimals;
        }

        const rawAmount = Math.round(amount * Math.pow(10, decimals));

        // Get quote
        const quoteParams = new URLSearchParams({
          inputMint: inMint,
          outputMint: outMint,
          amount: rawAmount.toString(),
          slippageBps: (slippage_bps || 50).toString(),
        });

        const quoteRes = await fetch(`${JUPITER_API}/quote?${quoteParams}`);
        const quote = (await quoteRes.json()) as any;

        if (quote.error) {
          return mcpResponse.error(`Quote failed: ${quote.error}`);
        }

        // Get swap transaction
        const swapRes = await fetch(`${JUPITER_API}/swap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: keypair.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
          }),
        });

        const swapData = (await swapRes.json()) as any;

        if (swapData.error) {
          return mcpResponse.error(`Swap failed: ${swapData.error}`);
        }

        // Deserialize and sign
        const swapTxBuf = Buffer.from(swapData.swapTransaction, "base64");
        const tx = VersionedTransaction.deserialize(swapTxBuf);
        tx.sign([keypair]);

        // Send
        const signature = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, "confirmed");

        logger.info(
          `Swap executed: ${amount} ${input_mint} → ${output_mint} — tx: ${signature}`
        );

        return mcpResponse.success({
          success: true,
          signature,
          input_mint,
          output_mint,
          input_amount: amount,
          output_amount:
            Number(quote.outAmount) / Math.pow(10, 9),
          network,
          explorer: `https://solscan.io/tx/${signature}`,
        });
      } catch (error: any) {
        logger.error("execute_swap failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_stake_accounts",
    "Get all stake accounts for a Solana wallet",
    {
      wallet_address: z.string().describe("Wallet address to check"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ wallet_address, network }) => {
      try {
        const connection = getConnection(network);
        const wallet = new PublicKey(wallet_address);

        const stakeAccounts = await connection.getParsedProgramAccounts(
          new PublicKey("Stake11111111111111111111111111111111111111"),
          {
            filters: [
              { memcmp: { offset: 12, bytes: wallet.toBase58() } },
            ],
          }
        );

        const accounts = stakeAccounts.map((sa) => {
          const data = (sa.account.data as any).parsed?.info;
          return {
            address: sa.pubkey.toBase58(),
            lamports: sa.account.lamports,
            sol: sa.account.lamports / 1e9,
            state: data?.stake?.delegation?.status || "unknown",
            validator: data?.stake?.delegation?.voter || null,
            activation_epoch: data?.stake?.delegation?.activationEpoch || null,
          };
        });

        return mcpResponse.success({
          wallet: wallet_address,
          stake_account_count: accounts.length,
          total_staked_sol: accounts.reduce((sum, a) => sum + a.sol, 0),
          accounts,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_stake_accounts failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );
}
