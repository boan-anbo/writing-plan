import { SectionTreeParseError } from "../lib/entities/section-tree-parse-error";
import { WritingPlanOptions } from "../lib/entities/writing-plan-options";
import { extractMarkerTokens, generateSectionsFromText } from "../lib/section-tree";
import WritingPlan from "../lib/writing-plan";
import { getLinesFromText } from '../lib/reader';




it('should extract all marker tokens', function () {
  const text = '<1000>1000Content<300>\n300Content</>\n<200>\n</>\n</>\n<400>400Content</>'
  const lines = getLinesFromText(text);
  const tokens = extractMarkerTokens(lines, new WritingPlanOptions())
  expect(tokens.length).toBe(8)

});

it('should generate sections from text', function () {
  const text = '<1000>1000Content<300>\n300Content</>\n<200>\n</>\n</>\n<400>400Content<100|100SectionTitle><50><25></></></></>'
  const sections = generateSectionsFromText(text, new WritingPlanOptions())
  expect(sections.length).toBe(7)
  expect(sections[1].parentId).toBe(sections[0].id)
  expect(sections[2].parentId).toBe(sections[1].parentId)

  expect(sections[3].parentId).toBeNull();

  expect(sections[sections.length - 1].level).toBe(3)

});

it('should auto assign word targets for empty tags', () => {
  const text =
    "<1000>" +
    "<>400</>" +
    "<200>" +
    "<></>" +
    "<>" +
    "<></>" +
    "<></>" +
    "</>" +
    "</>" +
    "<></>" +
    "</>";
  const sections = generateSectionsFromText(text, new WritingPlanOptions())
  // console.log(JSON.stringify(sections, null, 2))
  expect(sections.length).toBe(8)
  expect(sections[0].wordTarget).toBe(1000)
  expect(sections[1].wordTarget).toBe(400)
  expect(sections[1].content).toBe('400')
  expect(sections[2].wordTarget).toBe(200)
  expect(sections[3].wordTarget).toBe(100)
  expect(sections[4].wordTarget).toBe(100)
  expect(sections[5].wordTarget).toBe(50)
  expect(sections[6].wordTarget).toBe(50)
  expect(sections[6].isTargetCalculated).toBe(true)
  expect(sections[7].wordTarget).toBe(400)
})

it('should calculate estimated complete time', () => {
  const test = '<1000></>';
  const sections = generateSectionsFromText(test, new WritingPlanOptions({
    currentWritingSpeed: 100,
  }))
  expect(sections[0].estimatedTimeToComplete).toBe(10)
})

// currently there is no way to know which open marker misses a close marker because that's the nature of the open & close tag systems. For example, if you open two tags and provide only one close tag, it will still be arbitrary to decide which one the close tag points to. The close tag, of course, could use matching description but that only lessen and not solve the problem because the two open tag could very well be the same tag. So the best I can do now is to point to the last unclosed tag, that at least can point to the correct root tag, not the very first root tag.
it('should throw and point to the correct unclosed marker', () => {
  const text = `<1000></> <2000><500><300> </> </>`;
  // expect to throw

  expect(
    () =>  new WritingPlan(text, new WritingPlanOptions())
  ).toThrowError(SectionTreeParseError);

  try {
    new WritingPlan(text, new WritingPlanOptions())
  } catch (e: any) {
    if (e instanceof SectionTreeParseError) {
      expect(e.errorMarker).toBe('<2000>')
    }
  }
})

it('should generate correct level order', () => {
  const text = `<1000><100><50></></><200></><300></></>`;

  const plan = new WritingPlan(text, new WritingPlanOptions());
  const section200 = plan.sections[3];
  expect(section200.marker).toBe('<200>');
  expect(section200.order).toBe(3)
  expect(section200.level).toBe(1)
  expect(section200.levelOrder).toBe(1)

  const section300 = plan.sections[4];
  expect(section300.marker).toBe('<300>');
  expect(section300.levelOrder).toBe(2)
})

it(`parent should not contain child's content`, () => {
  const text = `<1000>1000BEGIN<100>100</>1000MID<200>200<50>50<1000>1000BEGIN<100>100</>1000MID<200>200<50>50</></>1000END</></></>1000END</>`
  const plan = new WritingPlan(text, new WritingPlanOptions());
  expect(plan.sections[0].content).toBe('1000BEGIN1000MID1000END')
  expect(plan.sections[1].content).toBe('100')
  expect(plan.sections[2].content).toBe('200')
  expect(plan.sections[3].content).toBe('50')

  expect(plan.sections[6].content).toBe('200')
  expect(plan.sections[plan.sections.length - 1].content).toBe('50')
})

it('sections should have correct end index', () => {
  const text = '<1000>12345</><200></>';
  const closeEndChar = text.charAt(13);
  const closeBegingChar = text.charAt(11);
  expect(closeEndChar).toBe('>')
  expect(closeBegingChar).toBe('<')
  const result = new WritingPlan(text);

  expect(result.sections[0].markerOpenEndIndex).toBe(5)
  expect(result.sections[0].markerCloseIndex).toBe(11)
  expect(result.sections[0].markerCloseEndIndex).toBe(13)
})

it('sections should have start and end positions', () => {
  const text = '<1000>Study</><200></>';
  const result = new WritingPlan(text);
  const indexChar = text.charAt(13);
  expect(indexChar).toBe('>');
  expect(result
    .getFirstSection().sectionEndPosition.index)
    .toEqual(13);

})
