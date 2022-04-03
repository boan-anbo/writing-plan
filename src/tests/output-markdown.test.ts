import WritingPlan from '../lib/writing-plan';

it('should export markdown', () => {
  const text = `<1000|Test Text>\n## Internal Markdown\n<40># FEFHUWEIOF</> \n efjiwopafj eiowapfj ewoia\n</>`
  expect(new WritingPlan(text).outPutMarkdown().length).toBeGreaterThan(`# <1000> Test Text`.length)

  // const textWithTwoLevels = `<1000|Test Text>One<50>Two</>Three</>`
  // expect(new WritingPlan(textWithTwoLevels).outPutMarkdown()).toBe(`# <1000> Test Text`);
});
