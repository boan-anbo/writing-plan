import { WritingPlanOptions } from '../entities/writing-plan-options';
import { Line } from '../line';
import { Section } from '../section';

export const extractSectionContent = (section: Section, lines: Line[], childrenSection: Section[], options: WritingPlanOptions): string => {
  // go from section start to end, and extract the content exlucding those in the children sections
  let content = '';
  // for loop over lines
  for (const line of lines) {
    // if the line is in the section
    if (line.lineNumber >= section.sectionStartPosition.line && line.lineNumber <= section.sectionEndPosition.line) {
      // check if the line is in the children sections
      let isInChildrenSection = false;
      // leave a marker for last checked index on the line in case there are more than one children sections. For example, the marker after checking one children will be the last index of the the childdren.
      // otherwise, each children section will trigger a substring from the beginning
      let lastCheckedIndex = section.sectionStartPosition.index;
      for (const childSection of childrenSection) {
        if (line.lineNumber > childSection.markerOpenLine && line.lineNumber < childSection.markerCloseLine) {
          isInChildrenSection = true;
        } else if (
          line.lineNumber === childSection.markerOpenLine) {
          const contentBeforeChildSectionBegins = line.content.substring(lastCheckedIndex, childSection.markerOpenIndex);
          content += contentBeforeChildSectionBegins;
          lastCheckedIndex = childSection.sectionEndPosition.index;
          // set the marker to say this line is also in the children section
          isInChildrenSection = true;
        }
      }

      // if the line is not in the children sections
      if (!isInChildrenSection) {
        // sometimes a line has no children but is itself a children. In these cases, it needs to be determined if only the content within the tag is captured.
        if (line.lineNumber === section.sectionStartPosition.line) {
          content += line.content.substring(section.sectionStartPosition.index, section.sectionEndPosition.line === line.lineNumber ? section.sectionEndPosition.index : line.content.length);
        } else if (line.lineNumber === section.sectionEndPosition.line) {
          content += line.content.substring(section.sectionStartPosition.line === line.lineNumber ? section.sectionStartPosition.index : 0 , section.sectionEndPosition.index);
        } else {
          content += line.content + '\n';
        }
      } else {
        // if it is in child section
        // add the content from the last check index to the end of the line
          const contentFromEndOfTheLastChildToTheEndOfLine = line.content.substring(lastCheckedIndex, section.sectionEndPosition.index);
          content += contentFromEndOfTheLastChildToTheEndOfLine;
      }
    }
  }
  // replace the section's markers
  content = content.replace(options.getMarkerRegex(), '');
  return content;
};

