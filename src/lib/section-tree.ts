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
          markerLine: lineNumber,
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

// the central operation of the section tree, with all essential steps to build the tree.
export const generateSectionsFromText = (
  text: string,
  options: WritingPlanOptions
): Section[] => {
  const lines = getLinesFromText(text);
  const tokens = extractMarkerTokens(lines, options);
  const sections = generateSectionFromToken(tokens, options);
  const sectionsWithContent = populatSectionsWithContent(lines, sections, options);
  const sectionsWithWordTargetsCalculated = populateSectionWordTargets(sectionsWithContent);
  // update word targets and stats
  const sectionsWithItsOwnWordCounts = sectionsWithWordTargetsCalculated
    // update word states
    .map((section) => {
      section.updateSectionStatus();
      return section;
    });
  // populate children word countsk
  const sectionWithChildrenWordCounts = populateChildrenWordCountsAndTargets(sectionsWithItsOwnWordCounts);
  // return the final result with word count refreshed
  return sectionWithChildrenWordCounts.map((section) => {
    section.updateSectionStatus();
    return section;
  });

};

const populateChildrenWordCountsAndTargets = (sections: Section[]): Section[] => {
  // find all the children of the a section, and add all its children sections' word count to the parent section.
  return sections.map((section) => {
    section.wordCountChildren = getAllChildrenWordCountRecursively(section, sections);
    section.wordTargetActual = section.wordTargetNominal + getAllChildrenWordTargetOverflowRecursively(section, sections);
    return section;
  });
};

const getAllChildrenWordTargetOverflowRecursively = (section: Section, allSections: Section[], overflow: number=0): number => {
  // get all children for the given section
  const children = allSections.filter((s) => s.parentId === section.id);
  if (children.length > 0) {
    // loop over all children
    const allDirectChildrenWordTarget = children.reduce((acc, child) => {
      return acc + child.wordTargetNominal;
    }, 0);

    const difference = section.wordTargetNominal - allDirectChildrenWordTarget;
    // if there is overflow
    if (difference < 0) {
      overflow += Math.abs(difference);
    }

    // recursively call this function on all children
    children.forEach((child) => {
      overflow = getAllChildrenWordTargetOverflowRecursively(child, allSections, overflow);
    });
  }
  return overflow;
};

// a recursive function to calculate any section to include all its children and grand children's word count
const getAllChildrenWordCountRecursively = (section: Section, allSections: Section[], currentWordCount: number = 0): number => {
  // get all children for the given section
  const children = allSections.filter((s) => s.parentId === section.id);
  if (children.length > 0) {
    // loop over all children
    children.forEach((child) => {
      // if it has no children, add the child's word count to the current word count
      currentWordCount += child.wordCountSelf;
      // check if this child has children
      const grandChildren = allSections.filter((s) => s.parentId === child.id);
      if (grandChildren.length > 0) {
        // if it has children, recursively call this function to get all its children's word count
        // add the grand children's word count to the current child's word count
        currentWordCount = getAllChildrenWordCountRecursively(child, allSections, currentWordCount);
      }
    });
  }

  return currentWordCount;

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
  if (!rootSections.every((s) => s.wordTargetNominal)) {
    throw new SectionTreeParseError('Root sections must have word targets');
  }
  // make sure all children of root sections have word targets
  for (const rootSection of rootSections) {
    sections = populateWordTargetDivision(rootSection, sections);
  }

  let tryCount = 0;
  while (sections.some((s) => !s.wordTargetNominal)) {
    const unsetSection = sections.find((s) => !s.wordTargetNominal);
    const parentSection = sections.find(
      (s) => s.id === unsetSection.parentId && s.wordTargetNominal
    );
    sections = populateWordTargetDivision(parentSection, sections);

    if (tryCount > 100) {
      throw SectionTreeParseError.fromSection(
        'Could not populate all sections with word targets, perhaps due to unclosed or unassigned root sections',
        sections.find((s) => !s.wordTargetNominal)
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
  if (!rootSection.wordTargetNominal) {
    return sections;
  }
  const childrenWithWordTargets = sections.filter(
    (s) => s.parentId === rootSection.id && s.wordTargetNominal
  );
  const totalWordTargets = childrenWithWordTargets.reduce(
    (acc, s) => acc + s.wordTargetNominal,
    0
  );
  // the total words NOT written, also word budget that sub sections can use
  const missingWordTargets = rootSection.wordTargetNominal - totalWordTargets;

  const childrenWithoutWordTargets = sections.filter(
    (s) => s.parentId === rootSection.id && !s.wordTargetNominal
  );
  const childrenWithoutWordTargetsLength = childrenWithoutWordTargets.length;
  const missingWordTargetsPerChild = Math.floor(
    missingWordTargets / childrenWithoutWordTargetsLength
  );
  for (const child of childrenWithoutWordTargets) {
    const section = sections.find((s) => s.id === child.id);
    section.wordTargetNominal = missingWordTargetsPerChild;
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
        currentMarker
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
    const errorStartIndex = lastOpenedSection.markerOpenStartIndex;
    const errorEndIndex =
      lastOpenedSection.markerOpenStartIndex + lastOpenedSection.markerOpenLength;
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

