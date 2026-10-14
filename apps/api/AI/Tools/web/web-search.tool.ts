import { tool } from "@langchain/core/tools";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import { envConfig } from "@api/Config/env.config";

type TavilyResultRow = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
};

export const webSearchTool = tool(
  async ({ query, maxResults }) => {
    const search = new TavilySearch({
      tavilyApiKey: envConfig.TAVILY_API_KEY,
      maxResults,
      searchDepth: "advanced",
    });

    const response = await search.invoke({ query: query.trim() });

    if ("error" in response) {
      throw new Error(`Tavily search failed: ${response.error}`);
    }

    const results = (response.results ?? []) as TavilyResultRow[];

    if (results.length === 0) {
      throw new Error("Tavily search returned no results.");
    }

    return JSON.stringify({
      results: results.map((result) => ({
        title: result.title ?? result.url ?? "Untitled result",
        url: result.url ?? "",
        score: result.score ?? null,
        publishedAt: result.published_date ?? null,
        snippet: result.content ?? "",
      })),
    });
  },
  {
    name: "web_search",
    description:
      "Search the web for relevant information, current events, " +
      "and external sources. Returns ranked results with URLs, " +
      "titles, relevance scores, publication dates, and content snippets.",
    schema: z.object({
      query: z.string().trim().min(1).max(500),
      maxResults: z.number().int().min(1).max(10).default(5),
    }),
  },
);
