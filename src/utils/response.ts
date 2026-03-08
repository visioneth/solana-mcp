export const mcpResponse = {
  success: (data: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  }),
  error: (message: string) => ({
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  }),
};
