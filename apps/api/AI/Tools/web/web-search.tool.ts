import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exa } from "@api/Config/exa";
import { webSearchPrompt } from "@api/AI/PromptsTemplate/ToolsPrompt/Web-search-prompt";

export const webSearchTool = tool(
  async ({ query, maxResults }) => {
    const searchQuery = webSearchPrompt({ query });

    const response = await exa.search(searchQuery, {
      type: "auto",
      numResults: maxResults,
      contents: { highlights: true },
    });

    return JSON.stringify({
      results: response.results.map((result) => ({
        id: result.id,
        title: result.title ?? result.url,
        url: result.url,
        publishedAt: result.publishedDate ?? null,
        highlights: result.highlights ?? [],
      })),
    });
  },
  {
    name: "web_search",
    description:
      "Search the web for relevant information, current events, and external sources. Returns ranked results with URLs, titles, publication dates, and highlights.",
    schema: z.object({
      query: z.string().trim().min(1).max(500),
      maxResults: z.number().int().min(1).max(10).default(5),
    }),
  },
);
