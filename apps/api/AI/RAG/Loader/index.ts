import { loadPdf } from "./pdf.loader";
import { loadText } from "./text.loader";

export const allLoders = {
  pdf: loadPdf,
  text:loadText
}
