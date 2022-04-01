import { countWords } from "../lib/word-count";
import WritingPlan from '../lib/writing-plan';


it('should return the number of words in a string', () => {
  expect(countWords('hello 世界')).toBe(3);
  expect(countWords('世界杯足球赛')).toBe(6);
  expect(countWords('WorldCup 2022')).toBe(2);
  expect(countWords('400Content')).toBe(2);

});


it('root section should capture the grant children sections word count', () => {
  const text = `<100>One<100>Two<100>Three<100>Four</><100>Four</></><100>Three</></></>`

  const plan = new WritingPlan(text);

  expect(plan.getFirstSection().wordCount).toBe(6);
  expect(plan.sections[1].wordCount).toBe(5);
  expect(plan.sections[2].wordCount).toBe(3);
  expect(plan.sections[3].wordCount).toBe(1);
  expect(plan.totalBalance).toBe(-294);
  expect(plan.getFirstSection().wordBalanceSelf).toBe(-299);
  expect(plan.totalTargetNominal).toBe(100);
})


