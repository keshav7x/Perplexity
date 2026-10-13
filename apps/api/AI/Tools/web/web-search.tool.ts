
import { tool } from "ai";
import { exa } from "@api/Config/exa";
import { z } from "zod";
import { webSearchPrompt } from "@api/AI/PromptsTemplate/ToolsPrompt/Web-search-prompt";

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
    const searchQuery = webSearchPrompt({ query });

    const response = await exa.search(searchQuery, {
      type: "auto",
      numResults: maxResults,
      contents: {
        highlights: true,
      },
    });

    return {
      results: response.results.map((result) => ({
        id: result.id,
        title: result.title ?? result.url,
        url: result.url,
        publishedAt: result.publishedDate ?? null,
        highlights: result.highlights ?? [],
      })),
    };
  },
});
