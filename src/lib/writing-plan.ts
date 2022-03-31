import { WritingInfo } from './doc-info';
import { isCloseMarker, isOpenMarker } from './entities/is-open-marker';
import { WritingPlanOptions } from './entities/writing-plan-options';
import { Section } from './section';
import { generateSectionsFromText } from './section-tree';
import { MarkerMatch } from './marker-match';

export class WritingPlan {
  readonly options: WritingPlanOptions;
  readonly info: WritingInfo;
  readonly estimatedTimeToComplete: number;
  readonly sections: Section[];
  readonly totalBalance: number;
  readonly totalTargetNominal: number;
  readonly totalTargetActual: number;
  readonly totalWordCount: number;
  readonly totalSections: number;
  readonly isTotalTargetOverflown: boolean = false;
  readonly totalTargetOverflown: number = 0;

  constructor(text: string, options?: WritingPlanOptions) {
    if (!text) {
      throw new Error('WritingPlan cannot be instantiated without text');
    }
    if (!options) {
      // use default options if none are provided
      options = new WritingPlanOptions();
    }
    // set options
    this.options = options;
    // load info
    this.info = WritingInfo.fromPlainText(text, options);
    // load sections
    this.sections = generateSectionsFromText(text, options);
    // combine all estimated times for individual sections
    this.estimatedTimeToComplete = this.sections.reduce(
      (acc, section) => acc + section.estimatedTimeToComplete,
      0
    );
    // calculate total target nominal (i.e. based on marker)
    this.totalTargetNominal = this.getRootSections().reduce(
      (acc, section) => acc + section.wordTargetNominal,
      0
    );
    // calculate total target actual, including overflow
    this.totalTargetActual = this.getRootSections().reduce(
      (acc, section) => acc + section.wordTargetActual,
      0
    );
    // calculate total words
    this.totalWordCount = this.sections.reduce(
      (acc, section) => acc + section.wordCountSelf,
      0
    );
    // total sections
    this.totalSections = this.sections.length;

    // update overflown status
    this.isTotalTargetOverflown = this.totalTargetActual > this.totalTargetNominal;

    // calculate total balance, not counting those exceeding the word target
    this.totalBalance = this.totalWordCount - this.totalTargetActual;

    // calculate total target overflown
    this.totalTargetOverflown = this.totalTargetActual - this.totalTargetNominal;

  }

  hasPlan() {
    return this.info.hasPlan;
  }

  // get a copy of writing plan with all the sections but empty content
  getSkeletonPlan(): string {
    // get all markers
    const allMarkers: MarkerMatch[] = this.sections.reduce(
      (acc, section) => acc.concat(section.getMarkerMatch()),
      []
    );

    // sort first according to marker line, and then according to marker start index
    const sortedAllMarkers = allMarkers.sort((a, b) => {
      if (a.markerLine < b.markerLine) {
        return -1;
      }
      if (a.markerLine > b.markerLine) {
        return 1;
      }
      if (a.markerStartIndex < b.markerStartIndex) {
        return -1;
      }
      if (a.markerStartIndex > b.markerStartIndex) {
        return 1;
      }
      return 0;
    });

    return sortedAllMarkers.map(marker => marker.marker).join('\n\n');

  }

  clearAllContent() {
    this.sections.forEach(section => section.clearContent());
  }

  // get all content of sections by joining all text
  getAllSectionContents() {
    return this.sections.map(section => section.content).join(' ');
  }

  getSectionByMarker(line: number, startIndex: number, length: number): Section | null {
    const checkOpenMarker = (section: Section, line, startIndex, length) => section.markerOpenLine === line && section.markerOpenStartIndex === startIndex && section.markerOpenLength === length;
    const checkCloseMarker = (section: Section, line, startIndex, length) => section.markerCloseLine === line && section.markerCloseStartIndex === startIndex && section.markerCloseLength === length;
    return this.sections.find(section => checkOpenMarker(section, line, startIndex, length) || checkCloseMarker(section, line, startIndex, length)) ?? null;
  }

  getSectionById(id: string): Section | null {
    return this.sections.find(section => section.id === id) ?? null;
  }

  getParentSection(sectionId: string): Section | null {
    const section = this.getSectionById(sectionId);
    if (!section) {
      return null;
    }
    if (!section.parentId) {
      return null;
    }
    return this.sections.find(parent => parent.id === section.parentId) ?? null;
  }

  getSectionChildren(parentSectionId: string): Section[] {
    return this.sections.filter(section => section.parentId === parentSectionId);
  }

  getPreviousSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(section => section.order === currentSection.order - 1) ?? null;
  }

  getNextSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(nextSection => nextSection.order === currentSection.order + 1) ?? null;
  }


  getNextChildSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(nextSection => nextSection.order > currentSection.order && nextSection.parentId === currentSection.id) ?? null;
  }


  getNextSiblingSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.filter(nextSiblingSection =>
      nextSiblingSection.order > currentSection.order
      &&
      nextSiblingSection.parentId === currentSection.parentId).shift() ?? null;
  }

  getPreviousSiblingSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.filter(previousSiblingSection =>
      (previousSiblingSection.order < currentSection.order) // If I put order < current order, then it will be the first child of the parent section, not necessarily the immediate previous sibling. So I need to filter all its previous siblings and use the last one.
      &&
      previousSiblingSection.parentId === currentSection.parentId).pop() ?? null
  }

  getSectionByOrder(order: number): Section | null {
    return this.sections.find(section => section.order === order) ?? null;
  }

  toString() {
    return `WritingPlan: ${this.totalSections} sections, ${this.totalBalance} balance, ${this.totalTargetNominal} target, ${this.estimatedTimeToComplete} minutes`;
  }

  getFirstSection(): Section | null {
    return this.sections[0] ?? null;
  }

  getLastSection(): Section | null {
    return this.sections[this.sections.length - 1] ?? null;
  }

  getSectionByLineAndIndex(line: number, index: number): Section | null {
    // filter out sections in which to find the line and index;
    const sections = this.sections
      .filter(section => section.markerOpenLine <= line && section.markerCloseLine >= line)
      .filter(section => {
        if (section.markerOpenLine === line) {
          return section.markerOpenStartIndex <= index;
        }
        if (section.markerCloseLine === line) {
          return (section.markerCloseStartIndex + section.markerCloseLength) >= index;
        }
        return true;
      });

    const lastSection = sections[sections.length - 1];
    return lastSection ?? null;
  }

  getRootSections (): Section[] {
    return this.sections.filter(section => section.parentId === null);
  }

  getMarkerRegex(): RegExp {
    return this.options.getMarkerRegex();
  }


  // helper functions to determine is a marker is open or closed
  isMarker(markerString: string): boolean {
    return this.getMarkerRegex().test(markerString);
  }

  isOpenMarker(markerString: string): boolean {
    return isOpenMarker(markerString, this.options);
  }

  isCloseMarker(markerString: string): boolean {
    return isCloseMarker(markerString, this.options);
  }

  hasSectionId(sectionId: string): boolean {
    return this.sections.some(section => section.id === sectionId);
  }


}


export default WritingPlan;
