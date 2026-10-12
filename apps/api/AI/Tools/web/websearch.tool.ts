
import { tool } from "langchain";
import * as z from "zod";
import { exa } from "@api/Config/exa";
export const exaSearch = tool(
  async ({ query }) => {
    const result = await exa.search(query, {
      contents: { highlights: true },
    });

    return result.results.map((hit) => ({
      title: hit.title,
      url: hit.url,
      highlights: hit.highlights ?? [],
    }));
  },
  {
    name: "exa_search",
    description:
      "Search the web with Exa and return relevant page titles, URLs, and highlighted excerpts.",
    schema: z.object({
      query: z.string().min(1).describe("The natural-language search query"),
    }),
  },
);
