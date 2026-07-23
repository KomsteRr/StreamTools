import React from "react";

/**
 * Parses message text and replaces any word matching a 7TV (or other) emote code with an inline <img> element.
 *
 * @param message The original message text string
 * @param emoteMap Dictionary of emote names mapped to their image URLs
 * @param emoteStyle Optional CSS properties for customizing emote image appearance
 */
export function renderEmotedText(
  message: string,
  emoteMap: Record<string, string> | undefined,
  emoteStyle?: React.CSSProperties
): React.ReactNode {
  if (!message) return "";
  if (!emoteMap || Object.keys(emoteMap).length === 0) {
    return message;
  }

  // Split text by whitespace while retaining space boundaries
  const words = message.split(/(\s+)/);

  return words.map((part, index) => {
    // Check if whitespace
    if (/^\s+$/.test(part)) {
      return part;
    }

    const cleanWord = part.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    // Check exact match or clean match in emoteMap
    const emoteUrl = emoteMap[part] || emoteMap[cleanWord];
    if (emoteUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={emoteUrl}
          alt={cleanWord}
          title={cleanWord}
          style={{
            height: "1.4em",
            minHeight: "20px",
            verticalAlign: "middle",
            display: "inline-block",
            margin: "0 2px",
            ...emoteStyle,
          }}
        />
      );
    }

    return part;
  });
}
