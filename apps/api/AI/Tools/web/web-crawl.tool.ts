import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilyCrawl } from "@langchain/tavily";
import { envConfig } from "@api/Config/env.config";

const tavilyCrawl = new TavilyCrawl({
  maxDepth: 2,
  tavilyApiKey: envConfig.TAVILY_API_KEY,
  maxBreadth: 10,
  limit: 20,
  format: "markdown",
  allowExternal: false,
});

export const webCrawler = tool(
  async ({ url, instructions }) => {
    const result = await tavilyCrawl.invoke({
      url,
      ...(instructions ? { instructions } : {}),
    });

    if (!result.results?.length) {
      throw new Error("Tavily crawler returned no pages.");
    }

    return JSON.stringify({
      results: result.results.map((page:any) => ({
        url: page.url,
        content: page.raw_content,
      })),
    });
  },
  {
    name: "web_crawler",
    description:
      "Crawl a website from a starting URL and return extracted content from discovered pages. Stay within the starting website.",
    schema: z.object({
      url: z.string().url().describe("The starting webpage URL"),
      instructions: z.string().optional().describe("What content to look for"),
    }),
  },
);
