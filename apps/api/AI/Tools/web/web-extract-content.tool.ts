import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilyExtract } from "@langchain/tavily";
import { envConfig } from "@api/Config/env.config";

const tavilyExtract = new TavilyExtract({
  format: "markdown",
  tavilyApiKey: envConfig.TAVILY_API_KEY,
});

export const webExtractContent = tool(
  async ({ url, query }) => {
    const response = await tavilyExtract.invoke({
      urls: [url],
      ...(query ? { query } : {}),
    });

    const page = response.results?.[0];

    if (!page?.raw_content) {
      const failure = response.failed_results?.[0];
      throw new Error(
        failure?.error ?? "No readable content returned from Tavily.",
      );
    }

    return JSON.stringify({
      url: page.url,
      content: page.raw_content,
    });
  },
  {
    name: "web_extract_content",
    description:
      "Extract clean Markdown content from a webpage. Optionally prioritize content relevant to a query.",
    schema: z.object({
      url: z.string().url(),
      query: z.string().optional(),
    }),
  },
);
