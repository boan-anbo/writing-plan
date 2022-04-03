import WritingPlan from '../writing-plan';
import { ExportMarkdownOptions } from '../entities/export-markdown-options';

export const exportMarkdown = (plan: WritingPlan): string => {
  if (!plan.hasPlan()) {
    return plan.originalText;
  }

  let finalText = '';

  let exportOptions = plan.options.exportMarkdownOptions ? plan.options.exportMarkdownOptions :     new ExportMarkdownOptions();

  plan.sections.forEach(section => {
    const statInfo = `T: ${section?.wordTargetNominal} ${section.isSectionTargetOverflown ? `+ ${section.wordTargetOverflow}` : ''} | B: ${section.wordBalance > 0 ? '+' : ''}${section.wordBalance} | W: ${section?.wordCount}`
    // replace info for writing plan heading
    finalText += `\n${getMarkdownHeaderByLevel(section.level + 1)} <${section.wordTargetNominal}> ${section.title ?? ''} ${exportOptions.addWritingPlanStats ? ': ' + statInfo : ''}\n`;
    let content = section.content ?? '';
    // replace info for native markdown heading
    if (exportOptions.increseContentMarkdownLevels) {
      // use regex to find all markdown headers, if any increase the header level
      const regex = /^(#+)\s(.*)$/gm;
      content = content.replace(regex, (_match, headerLevel, headerText) => {
        // increase the original markdown by header levels of the section
        const newHeaderLevel = headerLevel.length + (section.level + 1);
        return `${getMarkdownHeaderByLevel(newHeaderLevel)} ${headerText}`.trim();
      });
    }
    content = content.replaceAll('\n', '\n\n');
    finalText += `\n${content}\n`;
  });

  return finalText.trim();

};

export const getMarkdownHeaderByLevel = (level: number) => {
  return `#`.repeat(level);

}
