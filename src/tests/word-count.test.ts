import { countWords } from "../lib/word-count";


it('should return the number of words in a string', () => {
  expect(countWords('hello 世界')).toBe(3);
  expect(countWords('世界杯足球赛')).toBe(6);
  expect(countWords('WorldCup 2022')).toBe(2);
  expect(countWords('400Content')).toBe(2);

});

