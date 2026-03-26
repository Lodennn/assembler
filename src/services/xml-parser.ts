// xml-parser.ts

export interface XNode {
  tag: string;
  text: string; // trimmed text content (for leaf nodes)
  children: XNode[];
}
function unescapeXML(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
export function parseXML(input: string): XNode {
  const tokens: string[] = [];
  // tokenize into opening tags, closing tags, and text
  const regex = /<\/?[^>]+>|[^<]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    const t = match[0].trim();
    if (t) tokens.push(t);
  }

  let pos = 0;

  function parseNode(): XNode {
    const openTag = tokens[pos++]; // e.g. <class>
    const tag = openTag?.replace(/[<>]/g, "").trim() ?? ""; // e.g. "class"
    const node: XNode = { tag, text: "", children: [] };

    while (pos < tokens.length) {
      const current = tokens[pos];

      if (current === `</${tag}>`) {
        // closing tag for this node
        pos++;
        break;
      } else if (current?.startsWith("</")) {
        // unexpected close — bail
        break;
      } else if (current?.startsWith("<")) {
        // child element
        node.children.push(parseNode());
      } else {
        // text content
        node.text = unescapeXML(current?.trim() ?? "");
        pos++;
      }
    }

    return node;
  }

  return parseNode();
}
