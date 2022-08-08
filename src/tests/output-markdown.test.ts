import WritingPlan from '../lib/writing-plan';
import * as fs from 'fs';

it('should export markdown', () => {
  const text = `<1000|Test Text>\n## Internal Markdown\n<40># FEFHUWEIOF</> \n efjiwopafj eiowapfj ewoia\n</>`;
  expect(new WritingPlan(text).outPutMarkdown().length).toBeGreaterThan(`# <1000> Test Text`.length);

  // const textWithTwoLevels = `<1000|Test Text>One<50>Two</>Three</>`
  // expect(new WritingPlan(textWithTwoLevels).outPutMarkdown()).toBe(`# <1000> Test Text`);
});

it('should export markdown with plain markdown mixed with writing plan tags', () => {

  const markdownTexts = [
    '# 2022-8-2 18:45:24',
    '[TOC]',
    '# Outline',
    '<1000|Test Text>',
    'test',
    '# Internal Markdown Header One',
    '# Internal Markdown Header Two',
    '</>',
    'Latest'
  ];
  const text = markdownTexts.join('\n');
  const writingPlan = new WritingPlan(text);
  const markdown = writingPlan.outPutMarkdown();
  console.log(markdown);
  expect(markdown.split('\n')).toStrictEqual(
    [
      '# 2022-8-2 18:45:24',
      '[TOC]', '# Outline', '# <1000> Test Text : T: 1000  | B: -991 | W: 9', 'test',
      '## Internal Markdown Header One',
      '## Internal Markdown Header Two',
      '</>',
      'Latest'
    ]);

});
it('should export markdown with multiple levels and not losing original information', () => {
  const markdownTexts = [
    '# 2022-8-2 18:45:24',
    '[TOC]',
    '# Outline',
    '<2000| Behaviorism and animal studies>',
    '<150 |Section introduction What was radical about behaviorism>',
    '# There were a set of things about radical behaviorism',
    '- Tolman himself attributes behaviorism as an ism to Watson.',
    '</>',
    '# Internal Markdown Header One',
    '</>'
  ];

  const writingPlan = new WritingPlan(markdownTexts.join('\n'));
  const markdown = writingPlan.outPutMarkdown();
  expect(markdown.split('\n')).toStrictEqual([
    '# 2022-8-2 18:45:24',
    '[TOC]',
    '# Outline',
    '# <2000>  Behaviorism and animal studies : T: 2000  | B: -1978 | W: 22',
    '## <150> Section introduction What was radical about behaviorism : T: 150  | B: -132 | W: 18',
    '### There were a set of things about radical behaviorism',
    '- Tolman himself attributes behaviorism as an ism to Watson.',
    '</>',
    '## Internal Markdown Header One',
    '</>'
  ]);
});

it('should parse long markdown', () => {
  // load ./src/test/test_assets/test-long-markdown.md
  const originalMarkdown: string[] = fs.readFileSync('./src/tests/assets/long-markdown-to-parse.md', 'utf8').split('\n');
  expect(originalMarkdown.length).toBeGreaterThan(100);
  const originalLength = originalMarkdown.length;
  const writingPlan = new WritingPlan(originalMarkdown.join('\n'));
  const writingPlanOutputMarkdown = writingPlan.outPutMarkdown();
  const parsedLength = writingPlanOutputMarkdown.split('\n').length;
  expect(parsedLength).toEqual(originalLength);
  expect(originalMarkdown.join('\n')).toEqual(writingPlanOutputMarkdown)
})
