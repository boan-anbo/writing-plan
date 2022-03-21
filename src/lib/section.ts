import { v4 } from 'uuid';

import { Position } from './entities/Position';
import { WritingPlanOptions } from './entities/writing-plan-options';
import { Line } from './line';
import { MarkerMatch } from './marker-match';
import { countWords } from './word-count';


export class Section {
  id: string = v4();
  level: number = 0;
  marker: string = '';
  markerOpenLine: number = 0;
  markerOpenIndex: number = 0;
  markerOpenLength: number = 0;
  markerCloseLine: number = 0;
  markerCloseIndex: number = 0;
  markerCloseLength: number = 0;
  title: string | null = null;
  content: string = '';
  // the word target set specifically and manually for the marker, not the caculated one;
  wordTarget: number | null = null;
  wordCount: number = 0;
  wordBalance: number = 0;
  // the word count is calculated based on others, not assigned manually.
  isTargetCalculated: boolean = false;
  // word budget is the max number of words that can be written in this section, i.e. it equals the word target in the parent section that was not spent by the children.
  wordBudget: number = 0;
  // overspent word budget is the number of words that are overspent in this section, i.e. it equals the word target in the parent section that was spent by the children.
  overBudget: number = 0;
  // whether word count is greater than the target
  completed: boolean = false;
  // in minutes;
  estimatedTimeToComplete: number = 0;
  parentId: string | null = null;
  order: number;

  constructor(section: Partial<Section>, options: WritingPlanOptions) {
    if (!section.marker || !options.getMarkerRegex().test(section.marker)) {
      throw new Error(`Invalid marker: ${section.marker}`);
    }

    Object.assign(this, section);

    // extract by marker
    const { markerBegin, markerEnd } = options;
    const markerRegex = new RegExp(
      `${markerBegin}(?<wordtarget>.*?)(:?\\|(?<title>.*?))?${markerEnd}`,
      'g'
    );
    const matchResults = markerRegex.exec(this.marker);
    if (matchResults?.groups) {
      const { wordtarget } = matchResults.groups;

      if (wordtarget) {
        const parsedNumber = parseInt(wordtarget, 10);
        // allow only integers  and positive numbers
        if (Number.isInteger(parsedNumber) && parsedNumber > 1) {
          this.wordTarget = parsedNumber;
        }
      }
      const { title } = matchResults.groups;
      if (title) {
        this.title = title;
      }
    }
  }

  static fromMarkerMatch(
    markerMatch: MarkerMatch,
    options: WritingPlanOptions
  ): Section {
    if (markerMatch.isOpenMarker) {
      const section = new Section(
        {
          marker: markerMatch.marker,
          markerOpenLine: markerMatch.markerOpenLine,
          markerOpenIndex: markerMatch.markerStartIndex,
          markerOpenLength: markerMatch.markerLength
        },
        options
      );
      return section;
    }
    if (markerMatch.isCloseMarker) {
      //   const section = new Section(
      //     {
      //       marker: markerMatch.marker,
      //       markerCloseLine: markerMatch.markerOpenLine,
      //       markerCloseIndex: markerMatch.markerStartIndex,
      //       markerCloseLength: markerMatch.markerLength,
      //     },
      //     options
      //   );
    }
    throw new Error(
      `Invalid marker open or close status: ${markerMatch.marker}`
    );
  }

  closeSection(
    marker: MarkerMatch,
    linesInBetween: Line[],
    options: WritingPlanOptions
  ): Section {
    if (marker.isCloseMarker) {
      this.markerCloseLine = marker.markerOpenLine;
      this.markerCloseIndex = marker.markerStartIndex;
      this.markerCloseLength = marker.markerLength;

      // get content between markers
      const content = linesInBetween.map((line) => line.content).join('\n');
      // remove content before the marker begins
      const contentAfterMarker = content.substring(
        this.markerOpenIndex + this.markerOpenLength
      );
      // remove all markers from content
      this.content = contentAfterMarker.replace(options.getMarkerRegex(), '');
      // count words
      this.wordCount = countWords(this.content);
      // calculate word balance
      this.wordBalance = this.wordCount - this.wordTarget;
      // calculate whether completed
      this.completed = this.wordBalance >= 0;
      // if current writing speed is provided calculate ETA in minutes
      if (!this.completed && options.currentWritingSpeed > 0) {
        this.estimatedTimeToComplete = Math.round(
          Math.abs(this.wordBalance) / options.currentWritingSpeed
        );
      }

      return this;
    }
    throw new Error(`Is not Close Marker: ${marker.marker}`);
  }

  // get the beginning and ending line numbers of the section
  getSectionLinesRange(): [Position, Position] {
    return [{
      line: this.markerOpenLine,
      index: this.markerOpenIndex
    }, {
      line: this.markerCloseLine,
      index: this.markerCloseIndex + this.markerCloseLength
    }];
  }

  isInSection(lineNumber: number, startIndex: number) {
    return (
      lineNumber >= this.markerOpenLine &&
      lineNumber <= this.markerCloseLine &&
      startIndex >= this.markerOpenIndex &&
      startIndex <= this.markerCloseIndex
    );
  }


}
