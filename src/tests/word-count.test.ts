import { countWords } from "../lib/word-count";
import WritingPlan from '../lib/writing-plan';
import { WritingPlanOptions } from '../lib/entities/writing-plan-options';
import { GoalStatus } from '../lib/const/goal-status';


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


it('should have correct goal status', () => {
  const option = new WritingPlanOptions({
    acceptableRange: 2
  })
  const not_started = `<10></>`
  expect(new WritingPlan(not_started, option).getFirstSection().goalStatus).toBe(GoalStatus.NOT_STARTED);
  const completed_shorter = `<10>One Two Three Four Five Six Seven Eight</>`
  expect(new WritingPlan(completed_shorter, option).getFirstSection().goalStatus).toBe(GoalStatus.COMPLETED);
  const completed_longer = `<10>One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve</>`
  expect(new WritingPlan(completed_longer, option).getFirstSection().goalStatus).toBe(GoalStatus.COMPLETED);
  // with no options
  expect(new WritingPlan(completed_longer).getFirstSection().goalStatus).toBe(GoalStatus.EXCEEDED);
  const in_progress = `<10>One Two Three Four Five</>`
  expect(new WritingPlan(in_progress, option).getFirstSection().goalStatus).toBe(GoalStatus.IN_PROGRESS);
  const exceeded = `<10>One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen</>`
  expect(new WritingPlan(exceeded, option).getFirstSection().goalStatus).toBe(GoalStatus.EXCEEDED);


})
