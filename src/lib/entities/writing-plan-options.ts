import { CustomSection } from "../customize-section";
import { escapeRegExp } from "../utils/regex-util";

export class WritingPlanOptions {
  markerBegin: string = "<";
  markerEnd: string = ">";
  customSections: CustomSection[] = [];
  // the current writing speed: words per minute;
  currentWritingSpeed: number = 0;
  documentName: string | null = "";

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
