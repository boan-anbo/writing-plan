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
          const contentBeforeChildSectionBegins = line.content.substring(lastCheckedIndex, childSection.markerOpenStartIndex);
          content += contentBeforeChildSectionBegins;
          lastCheckedIndex = childSection.sectionEndPosition.index + 1;
          // set the marker to say this line is also in the children section
          isInChildrenSection = true;
        }
      }

      // if the line is not in the children sections
      if (!isInChildrenSection) {
        // sometimes a line has no children but is itself a children. In these cases, it needs to be determined if only the content within the tag is captured.
        if (line.lineNumber === section.sectionStartPosition.line) {
          content += line.content.substring(section.sectionStartPosition.index, section.sectionEndPosition.line === line.lineNumber ? section.sectionEndPosition.index + 1 : line.content.length);
        } else if (line.lineNumber === section.sectionEndPosition.line) {
          content += line.content.substring(section.sectionStartPosition.line === line.lineNumber ? section.sectionStartPosition.index : 0, section.sectionEndPosition.index + 1);
        } else {
          content += line.content + '\n';
        }
      } else {
        // if it is in child section
        // add the content from the last check index to the end of the line
        // only get the remaining content if the last checked index is larger than 0. If it's 0, it means it's a new line that belongs to the child section. Not part of a string between the parent and the child.
        // i.e. it is for <1000>CONTENT_TO_CAPTURE<500>CONTENT_TO_LEAVE_OUT</></500>
        if (lastCheckedIndex > 0) {
          const contentFromEndOfTheLastChildToTheEndOfLine = line.content.substring(lastCheckedIndex, section.sectionEndPosition.index + 1);
          content += contentFromEndOfTheLastChildToTheEndOfLine;
        }
      }
    }
  }
  // replace the section's markers
  content = content.replace(options.getMarkerRegex(), '');
  // replace all excluded content patterns
  if (options?.excludedContentPatterns.size > 0) {
    for (const pattern of options.excludedContentPatterns) {
      content = content.replaceAll(new RegExp(pattern, 'g'), '');
    }
  }
  return content;
};

