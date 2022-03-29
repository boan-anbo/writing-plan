import { v4 } from 'uuid';

import { Position } from './entities/Position';
import { WritingPlanOptions } from './entities/writing-plan-options';
import { MarkerMatch } from './marker-match';
import { countWords } from './word-count';


export class Section {
  id: string = v4();
  level: number = 0;
  marker: string = '';
  markerClose: string = '';
  options: WritingPlanOptions = new WritingPlanOptions();
  sectionStartPosition: Position;
  sectionEndPosition: Position;
  markerOpenLine: number = 0;
  markerOpenStartIndex: number = 0;
  markerOpenEndIndex: number = 0;
  markerOpenLength: number = 0;
  markerCloseLine: number = 0;
  markerCloseStartIndex: number = 0;
  markerCloseLength: number = 0;
  markerCloseEndIndex: number = 0;
  title: string | null = null;
  content: string = '';
  // the word target set specifically and manually for the marker, not the caculated one;
  wordTarget: number | null = null;
  wordCountSelf: number = 0;
  wordCountChildren: number = 0;
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
  levelOrder: number;

  constructor(section: Partial<Section>, options: WritingPlanOptions) {
    if (!section.marker || !options.getMarkerRegex().test(section.marker)) {
      throw new Error(`Invalid marker: ${section.marker}`);
    }

    // set options
    this.options = options;

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
          markerOpenLine: markerMatch.markerLine,
          markerOpenStartIndex: markerMatch.markerStartIndex,
          markerOpenEndIndex: markerMatch.markerStartIndex + markerMatch.marker.length - 1,
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
    marker: MarkerMatch
  ): Section {
    if (marker.isCloseMarker) {
      this.markerCloseLine = marker.markerLine;
      this.markerCloseStartIndex = marker.markerStartIndex;
      this.markerCloseLength = marker.markerLength;
      this.markerCloseEndIndex = marker.markerEndIndex;
      this.markerClose = marker.marker;

      // add position
      this.sectionStartPosition = new Position(this.markerOpenLine, this.markerOpenStartIndex);

      this.sectionEndPosition = new Position(this.markerCloseLine, this.markerCloseEndIndex);
      this.content = '';
      // count words

      return this;
    }
    throw new Error(`Is not Close Marker: ${marker.marker}`);
  }

  // get the beginning and ending line numbers of the section
  getSectionLinesRange(): [Position, Position] {
    return [{
      line: this.markerOpenLine,
      index: this.markerOpenStartIndex
    }, {
      line: this.markerCloseLine,
      index: this.markerCloseStartIndex + this.markerCloseLength
    }];
  }

  isInSection(lineNumber: number, startIndex: number) {
    return (
      lineNumber >= this.markerOpenLine &&
      lineNumber <= this.markerCloseLine &&
      startIndex >= this.markerOpenStartIndex &&
      startIndex <= this.markerCloseStartIndex
    );
  }

  clearContent() {
    this.content = '';
  }

  updateWordStat() {

    this.wordCountSelf = countWords(this.content);
    // calculate combined word count
    this.wordCount = this.wordCountSelf + this.wordCountChildren;
    // calculate word balance
    this.wordBalance = this.wordCountSelf - this.wordTarget;
    // calculate whether completed
    this.completed = this.wordBalance >= 0;
    // if current writing speed is provided calculate ETA in minutes
    if (!this.completed && this.options.currentWritingSpeed > 0) {
      this.estimatedTimeToComplete = Math.round(
        Math.abs(this.wordBalance) / this.options.currentWritingSpeed
      );
    }
  }

  // get both open and end markers and return them as marker matches
  getMarkerMatch(): MarkerMatch [] {
    const markerOpenMatch = new MarkerMatch(
      this.markerOpenLine,
      this.markerOpenStartIndex,
      this.markerOpenEndIndex,
      this.marker,
      true
    );
    const markerCloseMatch = new MarkerMatch(
      this.markerCloseLine,
      this.markerCloseStartIndex,
      this.markerCloseEndIndex,
      this.markerClose,
      false
    );
    return [markerOpenMatch, markerCloseMatch];
  }
}
