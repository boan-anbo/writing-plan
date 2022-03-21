import { WritingInfo } from './doc-info';
import { isCloseMarker, isOpenMarker } from './entities/is-open-marker';
import { WritingPlanOptions } from './entities/writing-plan-options';
import { Section } from './section';
import { generateSectionsFromText} from './section-tree';

export class WritingPlan {
  readonly options: WritingPlanOptions;
  readonly info: WritingInfo;
  readonly estimatedTimeToComplete: number;
  readonly sections: Section[];
  readonly totalBalance: number;
  readonly totalTarget: number;
  readonly totalSections: number;

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
    // calculate total balance, not counting those exceeding the word target
    this.totalBalance = this.sections.reduce(
      (acc, section) =>
        acc + (section.wordBalance < 0 ? section.wordBalance : 0),
      0
    );
    // calculate total target
    this.totalTarget = this.sections.reduce(
      (acc, section) => acc + section.wordTarget,
      0
    );
    // total sections
    this.totalSections = this.sections.length;

  }

  hasPlan() {
    return this.info.hasPlan;
  }

  getSectionByMarker(line: number, startIndex: number, length: number): Section | null {
    const checkOpenMarker = (section: Section, line, startIndex, length) => section.markerOpenLine === line && section.markerOpenIndex === startIndex && section.markerOpenLength === length;
    const checkCloseMarker = (section: Section, line, startIndex, length) => section.markerCloseLine === line && section.markerCloseIndex === startIndex && section.markerCloseLength === length;
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

  getNextSiblingSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(nextSection => nextSection.order > currentSection.order && nextSection.parentId === currentSection.parentId) ?? null;
  }

  getNextChildSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(nextSection => nextSection.order > currentSection.order && nextSection.parentId === currentSection.id) ?? null;
  }

  getPreviousSiblingSection(currentSectionId: string): Section | null {
    const currentSection = this.getSectionById(currentSectionId);
    if (!currentSection) {
      return null;
    }
    return this.sections.find(section => section.order < currentSection.order && section.parentId === section.parentId) ?? null;
  }

  getSectionByOrder(order: number): Section | null {
    return this.sections.find(section => section.order === order) ?? null;
  }

  toString() {
    return `WritingPlan: ${this.totalSections} sections, ${this.totalBalance} balance, ${this.totalTarget} target, ${this.estimatedTimeToComplete} minutes`;
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
          return section.markerOpenIndex <= index;
        }
        if (section.markerCloseLine === line) {
          return (section.markerCloseIndex + section.markerCloseLength) >= index;
        }
        return true;
      });

    const lastSection = sections[sections.length - 1];
    return lastSection ?? null;
  }

  getMarkerRegex(): RegExp {
    return this.options.getMarkerRegex()
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


}


export default WritingPlan;
