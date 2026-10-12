import { exa } from "@api/Config/exa";

export async function scrapWeb(url: string): Promise<string> {
  try {
    const response = await exa.getContents([url], {
      text: true,
      livecrawl: "always",
    });

    const page = response.results[0];

    if (!page?.text) {
      throw new Error("No readable content returned from Exa.");
    }

    return `Source Title: ${page.title}\nSource URL: ${page.url}\n\nContent:\n${page.text}`;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to scrape ${url}:`, message);
    throw error;
  }
}