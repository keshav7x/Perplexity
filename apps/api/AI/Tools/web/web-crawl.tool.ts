import { envConfig } from "@api/Config/env.config";
import { TavilyCrawl } from "@langchain/tavily";

const tavilyCrawl = new TavilyCrawl({
  maxDepth: 2,
  tavilyApiKey:envConfig.TAVILY_API_KEY,
  maxBreadth: 10,
  limit: 20,
  format: "markdown",
  allowExternal: false,
});

export const webCrawler = {
  name: "web_crawler",
  description:
    "Crawl a website starting from a URL and return extracted content from discovered pages.",
  invoke: async (input: { url: string; instructions?: string }) => {
    const result = await tavilyCrawl.invoke(input);

    if (!result.results?.length) {
      throw new Error("Tavily crawler returned no pages.");
    }

    return result.results.map((page:any) => ({
      url: page.url,
      content: page.raw_content,
    }));
  },
};