import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exa } from "@api/Config/exa";

export const exaWebFetch = tool(
  async ({ query, url }) => {
    const result = await exa.getContents([url], {
      highlights: { query },
    });

    return JSON.stringify({
      results: result.results.map((page) => ({
        url: page.url,
        title: page.title ?? "Untitled page",
        highlights: page.highlights ?? [],
      })),
    });
  },
  {
    name: "exa_web_fetch",
    description:
      "Fetch a specific webpage and return excerpts relevant to a query. Requires an existing URL.",
    schema: z.object({
      query: z.string().min(1).describe("Information to find on the page"),
      url: z.string().url().describe("The webpage URL to fetch"),
    }),
  },
);
