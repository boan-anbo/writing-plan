import {WritingPlanOptions} from "../lib/entities/writing-plan-options";
import {extractMarkerTokens, generateSectionsFromText} from "../lib/section-tree";


it('extract sections one level at a time', () => {
  // const options = new WritingPlanOptions();
  // const contentInTheMiddle = '1000 Words Content\n<300>\n300 Words Content\n</>'
  // const text = `<1000>\n${contentInTheMiddle}\n</>`
  // const lines = getLinesFromText(text, options )
  // const section = getOneLevelSections(lines, options)
  // expect(section.content).toBe(contentInTheMiddle)
  // expect(sectionInMiddle[0].content).toBe('1000 Words Content')
  // expect(sectionInMiddle[3].content).toBe('</')

})

it('should extract all marker tokens', function () {
  const text = '<1000>1000Content<300>\n300Content</>\n<200>\n</>\n</>\n<400>400Content</>'
  const tokens = extractMarkerTokens(text, new WritingPlanOptions())
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
