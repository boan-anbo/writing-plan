import { generateUniqueSectionId } from '../lib/utils/section-id';
import WritingPlan from '../lib/writing-plan';
import { WritingPlanOptions } from '../lib/entities/writing-plan-options';

it('generate unique timestamp', () => {
  const text = '<1000></>';
  const plan = new WritingPlan(text);
  const allIdGenerateds: string [] = [];
  // const conflicted: string[] = [];

  // loop over 10000 times
  for (let i = 0; i < 5000; i++) {
    const id = generateUniqueSectionId(plan, 0);
    allIdGenerateds.push(id);
    plan.getFirstSection().id = id;

  }

  // console.log('all generated ids: ', allIdGenerateds);
  // console.log('all conflict ids: ', conflicted);
  expect(allIdGenerateds.length).toBe(5000);
  // expect(conflicted.length).toBe(0);
});

it('plan should check if section id already exists', () => {
  const text = '<1000></>';
  const plan = new WritingPlan(text);
  const idString = 'testfjeiowapfjeiwoapfjwea';
  const unusedId = 'testfjeiowapfjeiwoapfjwea1';
  plan.getFirstSection().id = idString;
  expect(plan.hasSectionId(idString)).toBe(true);
  expect(plan.hasSectionId(unusedId)).toBe(false);
  expect(plan.getFirstSection().id).toBe(idString);
});

it('should generate id based on base number', () => {
  const plan = new WritingPlan('<1000>1000BEGIN<100>100</>1000MID<200>200<50>50<1000>1000BEGIN<100>100</>1000MID<200>200<50>50</></>1000END</></></>1000END</>', new WritingPlanOptions());
  const empty = generateUniqueSectionId(plan);
  expect(empty.endsWith('0')).toBe(true )
  const zero =  generateUniqueSectionId(plan, 0);
  expect(zero.endsWith('0')).toBe(true)  // first section
  const first =  generateUniqueSectionId(plan, 1);
  expect(first.endsWith('1')).toBe(true)  // first section
  const second =  generateUniqueSectionId(plan, 2);
  expect(second.endsWith('2')).toBe(true)  // first section
  plan.getFirstSection().id = second;
  plan.sections[1].id = first;
})
