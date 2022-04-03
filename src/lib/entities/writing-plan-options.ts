import { CustomSection } from "../customize-section";
import { escapeRegExp } from "../utils/regex-util";
import { ExportMarkdownOptions } from './export-markdown-options';

export class WritingPlanOptions {
  markerBegin: string = "<";
  markerEnd: string = ">";
  customSections: CustomSection[] = [];
  // the current writing speed: words per minute;
  currentWritingSpeed: number = 0;
  documentName: string | null = "";
  // whether a section with child sections should only count its own words or words of all child sections as well.
  parentIncludeChildWordCount = true;
  // the patterns that will be excluded from the content and hence stats of the sections
  excludedContentPatterns: Set<string> = new Set();
  /**
  /*  the patterns that will be included in the content and but excluded from stats of the sections, i.e. they are still in content but not counted in stats;
   */
  excludedStatsPatterns: Set<string> = new Set();

  /**
   * the range within which the word balance will be accepted as finished.
   */
  acceptableRange;

  /**
   * the options for exporting markdown
   */
  exportMarkdownOptions = new ExportMarkdownOptions();

  constructor(options?: Partial<WritingPlanOptions>) {
    if (options) {
      Object.assign(this, options);
    }

    this.markerBegin = escapeRegExp(this.markerBegin);
    this.markerEnd = escapeRegExp(this.markerEnd);
  }

  getMarkerRegex(): RegExp {
    const regex = new RegExp(`${this.markerBegin}(.*?)${this.markerEnd}`, "g");
    return regex;
  }

}
