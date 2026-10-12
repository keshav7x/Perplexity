import { tool } from "langchain";
import * as z from "zod";
import { exa } from "@api/Config/exa";

export const exaWebFetch = tool(
  async ({ query, url }) => {
    const result = await exa.getContents([url], {
      highlights: { query },
    });

    return result.results.map((hit) => ({
      url: hit.url,
      title: hit.title,
      highlights: hit.highlights ?? [],
    }));
  },
  {
    name: "exa_web_fetch",
    description:
      "Fetch a webpage with Exa and return highlighted excerpts relevant to the supplied query.",
    schema: z.object({
      query: z.string().min(1).describe("What information to find on the page"),
      url: z.string().url().describe("The webpage URL to fetch"),
    }),
  },
);
