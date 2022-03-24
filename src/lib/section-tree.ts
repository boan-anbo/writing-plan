import { isCloseMarker, isOpenMarker } from './entities/is-open-marker';
import { SectionTreeParseError } from './entities/section-tree-parse-error';
import { WritingPlanOptions } from './entities/writing-plan-options';
import { Line } from './line';
import { MarkerMatch } from './marker-match';
import { getLinesFromText } from './reader';
import { Section } from './section';
import { extractSectionContent } from './utils/extract-section-content';


export const extractMarkerTokens = (
  lines: Line[],
  options: WritingPlanOptions
): MarkerMatch[] => {
  const markers: MarkerMatch[] = [];
  const regex = options.getMarkerRegex();
  lines.forEach((line) => {
    const match = line.content.matchAll(regex);
    if (match) {
      for (const m of match) {
        const marker = m[0];
        const lineNumber = line.lineNumber;
        const markerStartIndex = m.index;
        const markerEndIndex = (markerStartIndex + marker.length) - 1; // eg. < is 10, < in </> should be 12, not 10 + length (3).
        markers.push({
          marker,
          markerOpenLine: lineNumber,
          markerStartIndex,
          markerEndIndex,
          isOpenMarker: isOpenMarker(marker, options),
          isCloseMarker: isCloseMarker(marker, options),
          markerLength: marker.length
        });
      }
    }
  });
  return markers;
};

export const generateSectionsFromText = (
  text: string,
  options: WritingPlanOptions
): Section[] => {
  const lines = getLinesFromText(text);
  const tokens = extractMarkerTokens(lines, options);
  const sections = generateSectionFromToken(tokens, options);
  const sectionsWithContent = populatSectionsWithContent(lines, sections, options);
  const sectionsWithWordTargetsCalculated = populateSectionWordTargets(sectionsWithContent);
  return sectionsWithWordTargetsCalculated
    // update word states
    .map((section) => {
    section.updateWordStat();
    return section;
  });

};

export const populatSectionsWithContent = (allLines: Line[], sections: Section[], options: WritingPlanOptions): Section[] => {
  sections.forEach((section) => {
    // extract content from lines and store it to section entity
    section.content = extractSectionContent(
      section,
      getSectionLines(allLines, section),
      sections.filter((s) => s.parentId === section.id),
      options
    );

  });
  return sections;
};

// get lines by section's starting and end positions, not necessarily exlusively, meaning there might be other content before and after the section in the opening and ending lines.
const getSectionLines = (allLines: Line[], section: Section): Line[] => {
  return allLines.slice(section.sectionStartPosition.line, section.sectionEndPosition.line + 1);
};


export const populateSectionWordTargets = (
  sections: Section[]
): Section[] => {
  const rootSections = sections.filter((s) => s.level === 0);
  if (!rootSections.every((s) => s.wordTarget)) {
    throw new SectionTreeParseError('Root sections must have word targets');
  }
  // make sure all children of root sections have word targets
  for (const rootSection of rootSections) {
    sections = populateWordTargetDivision(rootSection, sections);
  }

  let tryCount = 0;
  while (sections.some((s) => !s.wordTarget)) {
    const unsetSection = sections.find((s) => !s.wordTarget);
    const parentSection = sections.find(
      (s) => s.id === unsetSection.parentId && s.wordTarget
    );
    sections = populateWordTargetDivision(parentSection, sections);

    if (tryCount > 100) {
      throw SectionTreeParseError.fromSection(
        'Could not populate all sections with word targets, perhaps due to unclosed or unassigned root sections',
        sections.find((s) => !s.wordTarget)
      );
    }
    tryCount++;
  }

  return sections;
};

export const populateWordTargetDivision = (
  rootSection: Section,
  sections: Section[]
): Section[] => {
  // if root section has no target, then return the sections as is.
  if (!rootSection.wordTarget) {
    return sections;
  }
  const childrenWithWordTargets = sections.filter(
    (s) => s.parentId === rootSection.id && s.wordTarget
  );
  const totalWordTargets = childrenWithWordTargets.reduce(
    (acc, s) => acc + s.wordTarget,
    0
  );
  // the total words NOT written, also word budget that sub sections can use
  const missingWordTargets = rootSection.wordTarget - totalWordTargets;

  const childrenWithoutWordTargets = sections.filter(
    (s) => s.parentId === rootSection.id && !s.wordTarget
  );
  const childrenWithoutWordTargetsLength = childrenWithoutWordTargets.length;
  const missingWordTargetsPerChild = Math.floor(
    missingWordTargets / childrenWithoutWordTargetsLength
  );
  for (const child of childrenWithoutWordTargets) {
    const section = sections.find((s) => s.id === child.id);
    section.wordTarget = missingWordTargetsPerChild;
    section.isTargetCalculated = true;
    // if the section has not been completed yet with words to be written
    if (missingWordTargets < 0) {
      section.wordBudget = missingWordTargets;
    }
  }
  // if missing word targets is larger than 0, that means the children overspent the budgets;
  if (missingWordTargets > 0) {
    const section = sections.find((s) => s.id === rootSection.id);
    section.wordBudget = missingWordTargets;
  }
  return sections;
};

export const generateSectionFromToken = (
  markerTokens: MarkerMatch[],
  options: WritingPlanOptions
): Section[] => {
  const sections: Section[] = [];
  const openedSectionStack: Section[] = [];
  // iterate through all the tokens and generate sections based on open and close tags
  let lastMarker: MarkerMatch;
  let openedSectionOrder = 0;
  for (const currentMarker of markerTokens) {
    if (currentMarker.isOpenMarker) {
      const openSection = Section.fromMarkerMatch(currentMarker, options);
      if (lastMarker && openedSectionStack.length > 0) {
        // if last one is open marker, meaning the current section is a child section; this works for both child and parent, and siling relationships because at this point, the siling, if there is, must have already been closed and moved out of the stack. The last element of the stack in this situation is always the parent section.
        openSection.parentId =
          openedSectionStack[openedSectionStack.length - 1].id;
      } else {
        // if there is no previous marker, meaning the current section is a root section
        openSection.parentId = null;
      }
      openSection.order = openedSectionOrder;
      if (openSection.parentId && openedSectionStack.length > 0) {
        // get parent's level
        const parentSection = openedSectionStack.find(
          (s) => s.id === openSection.parentId
        );
        if (parentSection) {
          openSection.level = parentSection.level + 1;
        }
      } else {
        openSection.level = 0;
      }
      openedSectionStack.push(openSection);
      openedSectionOrder++;
    } else {
      // the current marker is a close marker
      // get the last opened section
      const openedSection = openedSectionStack.pop();
      if (!openedSection) {
        throw SectionTreeParseError.fromMarker(
          'Closing tag with not matching open tag',
          currentMarker
        );
      }
      const completedSection = openedSection.closeSection(
        currentMarker,
      );
      sections.push(completedSection);
    }

    // save lastMarker match
    lastMarker = currentMarker;
  }

  if (openedSectionStack.length > 0) {
    // there are still opened sections
    const lastOpenedSection = openedSectionStack.pop();
    const errorMarker = lastOpenedSection.marker;
    const errorLine = lastOpenedSection.markerOpenLine;
    const errorStartIndex = lastOpenedSection.markerOpenIndex;
    const errorEndIndex =
      lastOpenedSection.markerOpenIndex + lastOpenedSection.markerOpenLength;
    throw new SectionTreeParseError(
      `There are unclosed sections.`,
      errorLine,
      errorStartIndex,
      errorEndIndex,
      errorMarker
    );
  }

  // populate marker order
  sections.forEach((section) => {
    section.levelOrder = sections.filter((s) => s.level === section.level).sort((a, b) => a.order - b.order).indexOf(section);
  });

  // return sections sort by order property
  return sections.sort((a, b) => a.order - b.order);
};

