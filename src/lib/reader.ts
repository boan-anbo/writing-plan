import { Line } from "./line";

// get all lines from a text
export const getLinesFromText = (
  text: string,
): Line[] => {
  return text
    .split("\n")
    .map((lineContent, lineIndex) => new Line(lineContent, lineIndex));
};

