import wordsCount from "words-count";

export const countWords = (text: string): number => {
  return wordsCount(text);
};
