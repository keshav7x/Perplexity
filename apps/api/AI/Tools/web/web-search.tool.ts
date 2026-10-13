
import { tool } from "ai";
import { exa } from "@api/Config/exa";
import { z } from "zod";

const webSearchInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Search query cannot be empty")
    .max(500, "Search query is too long"),

  maxResults: z.number().int().min(1).max(10).default(5),
});

export const webSearchTool = tool({
  description:
    "Search the web for relevant information, current events, " +
    "and external sources. Returns ranked results with URLs, " +
    "titles, and relevant highlights. Use web-fetch to retrieve " +
    "and inspect the full content of a specific page.",

  inputSchema: webSearchInputSchema,

  execute: async ({ query, maxResults }) => {
    const response = await exa.search(query, {
      type: "auto",
      numResults: maxResults,
      contents: {
        highlights: true,
      },
    });

    return {
      results: response.results.map((result:any) => ({
        id: result.id,
        title: result.title ?? result.url,
        url: result.url,
        publishedAt: result.publishedDate ?? null,
        highlights: result.highlights ?? [],
      })),
    };
  },
});
