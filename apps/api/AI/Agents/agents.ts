import type { Provider } from "../modelRegistery";
import { groqModel } from "../Models/Groq";
import { openRouterModel } from "../Models/openRouter";
import { createAgent } from "langchain";

import { webScrapeTool } from "../Tools/web/web-scrape.tool";
import { webCrawler } from "../Tools/web/web-crawl.tool";
import { exaWebFetch } from "../Tools/web/web-fetch.tool";
import { webSearchTool } from "../Tools/web/web-search.tool";
import { webExtractContent } from "../Tools/web/web-extract-content.tool";

export const agents = (model: any) => {
  const agent = createAgent({
    model: model,
    tools:[webExtractContent,webSearchTool,exaWebFetch,webCrawler,webScrapeTool],
  })
  return agent
}
