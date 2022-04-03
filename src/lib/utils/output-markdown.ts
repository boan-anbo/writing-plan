import WritingPlan from '../writing-plan';
import { ExportMarkdownOptions } from '../entities/export-markdown-options';

export const exportMarkdown = (plan: WritingPlan, exportOptions?: ExportMarkdownOptions): string => {
  let finalText = '';

  if (!exportOptions) {
    exportOptions = new ExportMarkdownOptions();
  }

  plan.sections.forEach(section => {
    finalText += `\n${getMarkdownHeaderByLevel(section.level + 1)} <${section.wordTargetNominal}> ${section.title ?? '' + ''}\n`;
    let content = section.content ?? '';
    if (exportOptions.increseContentMarkdownLevels) {
      // use regex to find all markdown headers, if any increase the header level
      const regex = /^(#+)\s(.*)$/gm;
      content = content.replace(regex, (_match, headerLevel, headerText) => {
        // increase the original markdown by header levels of the section
        const newHeaderLevel = headerLevel.length + (section.level + 1);
        return `${getMarkdownHeaderByLevel(newHeaderLevel)} ${headerText}`;
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
