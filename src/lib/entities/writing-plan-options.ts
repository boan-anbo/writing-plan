import { CustomSection } from "../customize-section";
import { escapeRegExp } from "../utils/regex-util";

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
