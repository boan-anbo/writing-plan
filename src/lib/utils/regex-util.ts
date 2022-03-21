export const escapeRegExp = (text: string): string => {
  return text.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};
