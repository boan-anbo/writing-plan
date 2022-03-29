export class MarkerMatch {
    markerLine: number;
    markerStartIndex: number;
    markerEndIndex: number;
    markerLength: number;
    marker: string;
    isOpenMarker: boolean;
    isCloseMarker: boolean;

    constructor(markerLine: number, markerStartIndex: number, markerEndIndex: number, marker: string, isOpenMarker: boolean) {
        this.markerLine = markerLine;
        this.markerStartIndex = markerStartIndex;
        this.markerEndIndex = markerEndIndex;
        this.markerLength = markerEndIndex - markerStartIndex + 1;
        this.marker = marker;
        this.isOpenMarker = isOpenMarker;
        this.isCloseMarker = !isOpenMarker;
    }


}

