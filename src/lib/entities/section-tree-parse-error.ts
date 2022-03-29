// the parser error  for user to debug unclosed sections;
import { MarkerMatch } from "../marker-match";
import { Section } from "../section";

export class SectionTreeParseError extends Error {
  errorLine: number;
  errorStartIndex: number;
  errorEndIndex: number;
  errorMarker: string;

  constructor(
    message: string,
    errorLine?: number,
    errorStartIndex?: number,
    errorEndIndex?: number,
    errorMarker?: string
  ) {
    super(
      `${message} Error Marker: ${errorMarker}, Line: ${errorLine}, StartIndex: ${errorStartIndex}, EndIndex: ${errorEndIndex}`
    );
    this.errorLine = errorLine;
    this.errorStartIndex = errorStartIndex;
    this.errorEndIndex = errorEndIndex;
    this.errorMarker = errorMarker;
    this.name = "SectionTreeParseError";
  }

  static fromSection(message: string, section: Section): SectionTreeParseError {
    return new SectionTreeParseError(
      message,
      section.markerOpenLine,
      section.markerOpenStartIndex,
      section.markerOpenStartIndex + section.markerOpenLength,
      section.marker
    );
  }

  static fromMarker(
    message: string,
    marker: MarkerMatch
  ): SectionTreeParseError {
    return new SectionTreeParseError(
      message,
      marker.markerLine,
      marker.markerStartIndex,
      marker.markerEndIndex,
      marker.marker
    );
  }
}
