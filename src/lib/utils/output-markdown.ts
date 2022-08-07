import WritingPlan from '../writing-plan';
import { ExportMarkdownOptions } from '../entities/export-markdown-options';

export const exportMarkdown = (plan: WritingPlan): string => {
  if (!plan.hasPlan()) {
    return plan.originalText;
  }

  let finalText: string[] = plan.originalText.split('\n');

  let exportOptions = plan.options.exportMarkdownOptions ? plan.options.exportMarkdownOptions :     new ExportMarkdownOptions();

  plan.sections.forEach(section => {
    const statInfo = `T: ${section?.wordTargetNominal} ${section.isSectionTargetOverflown ? `+ ${section.wordTargetOverflow}` : ''} | B: ${section.wordBalance > 0 ? '+' : ''}${section.wordBalance} | W: ${section?.wordCount}`
    // replace info for writing plan heading
    finalText[section.markerOpenLine] = `${getMarkdownHeaderByLevel(section.level + 1)} <${section.wordTargetNominal}> ${section.title ?? ''} ${exportOptions.addWritingPlanStats ? ': ' + statInfo : ''}`;
    // replace info for native markdown heading
    if (exportOptions.increseContentMarkdownLevels) {
      // iterate starting from the next line of the marker open line and until the marker close line,
      // skip the lines that belong to the children sections
      // and find markdown headers
      for (let i = section.markerOpenLine + 1; i < section.markerCloseLine; i++) {
        if (plan.isLineWithinChildrenSection(section, i)) {
          continue;
        }
        const lineContent = finalText[i];
        const regex = /^(#+)\s(.*)$/gm;
        const match = regex.exec(finalText[i]);
        if (match) {
          const newContent = lineContent.replace(regex, (_match, headerLevel, headerText) => {
            // increase the original markdown by header levels of the section
            const newHeaderLevel = headerLevel.length + (section.level + 1);
            return `${getMarkdownHeaderByLevel(newHeaderLevel)} ${headerText}`.trim();
          });
          finalText[i] = newContent;
        }
      }
    }
    // content = content.replaceAll('\n', '\n\n');
  });

  return finalText.join('\n');

};

export const getMarkdownHeaderByLevel = (level: number) => {
  return `#`.repeat(level);

}
