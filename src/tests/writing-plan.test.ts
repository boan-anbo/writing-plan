import WritingPlan from '../lib/writing-plan';

it('should get right total balance', () => {

  expect(new WritingPlan('<1000></>').totalBalance).toBe(-1000);
  const newPlan = new WritingPlan('<1000>One</><1000>Two<2000>Three</></>');
  expect(newPlan.totalBalance).toBe(-3997);

  // const newPlanOverBudgeted = new WritingPlan( '<2>One<3></></>')
  // console.log(JSON.stringify(newPlanOverBudgeted, null, 2));
  // expect(newPlanOverBudgeted.sections[0].overBudget).toBe(2);

});


it('should have writing plan string representation', () => {
  expect(new WritingPlan('<1000>One</><1000>Two<2000>Three</></>').toString().length).toBeGreaterThan(20);
});

it('should fetch section by marker and position', () => {
  const plan = new WritingPlan('<1000>One</><1000>Two\n<2000><100>Three</></></>');
  expect(plan.getSectionByMarker(1, 0, 6).marker).toBe('<2000>');
  expect(plan.getSectionByMarker(1, 6, 5).marker).toBe('<100>');
  expect(plan.getSectionByMarker(0, 9, 3).marker).toBe('<1000>');
  expect(plan.getSectionByMarker(1, 7, 10)).toBeNull();
});

it('should navigate by current section', () => {
  const plan = new WritingPlan('' +
    '<4000>Parent' +
    '<1000>Two' +
    '<500>\n' +
    '<100>Three</>' +
    '<200>Three</>' +
    '</>' +
    '<700>' +
    '</>' +
    '</>' +
    '</>' +
    '<5000>' +
    '</>'
  );

  const currentSection = plan.getSectionByOrder(2);
  expect(currentSection.marker).toBe('<500>');
  const currentSectionId = currentSection.id;
  expect(plan.getParentSection(currentSectionId).marker).toBe('<1000>');
  expect(plan.getPreviousSection(currentSectionId).marker).toBe('<1000>');
  expect(plan.getNextSection(currentSectionId).marker).toBe('<100>');
  expect(plan.getNextSiblingSection(currentSectionId).marker).toBe('<700>');
  expect(plan.getFirstSection().marker).toBe('<4000>');
  expect(plan.getLastSection().marker).toBe('<5000>');
  expect(plan.getNextChildSection(currentSectionId).marker).toBe('<100>');
  // test sibling navigation for root section
  const firstSection = plan.getFirstSection();
  expect(plan.getNextSiblingSection(firstSection.id).marker).toBe('<5000>');
  const lastSection = plan.getLastSection();
  expect(plan.getPreviousSiblingSection(lastSection.id).marker).toBe('<4000>');

  const sectionByCursor = plan.getSectionByLineAndIndex(1, 5);
  expect(sectionByCursor.marker).toBe('<100>');


});

it('should find immediate previous and next siblings correctly', () => {

  const difficultText = `<1000> 1000 <500> 500 <100> 100 </> <50> 50 </> <25> 25 </> </> <400> 400 </> <300> 300 </> <200> </> <100> </> <20> </> <50> </> </> `;

  const difficultPlan = new WritingPlan(difficultText);

  const section25 = difficultPlan.getSectionByOrder(4);
  expect(section25.marker).toBe('<25>');
  expect(difficultPlan.getPreviousSiblingSection(section25.id).marker).toBe('<50>');

  const section50 = difficultPlan.getSectionByOrder(3);
  expect(section50.marker).toBe('<50>');
  expect(difficultPlan.getNextSiblingSection(section50.id).marker).toBe('<25>');
});