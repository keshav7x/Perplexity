import { createAgent } from "langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { webScrapeTool } from "../Tools/web/web-scrape.tool";
import { webCrawler } from "../Tools/web/web-crawl.tool";
import { exaWebFetch } from "../Tools/web/web-fetch.tool";
import { webSearchTool } from "../Tools/web/web-search.tool";
import { webExtractContent } from "../Tools/web/web-extract-content.tool";
import { PERPLEXITY_SYSTEM_PROMPT } from "../PromptsTemplate/system-prompts/core.prompt";

export const agents = (model: BaseChatModel) => {
  return createAgent({
    model,
    tools: [
      webExtractContent,
      webSearchTool,
      exaWebFetch,
      webCrawler,
      webScrapeTool,
    ],
    systemPrompt:PERPLEXITY_SYSTEM_PROMPT
  });
};
