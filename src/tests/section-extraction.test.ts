import { isCloseMarker, isOpenMarker } from '../lib/entities/is-open-marker';
import {WritingPlanOptions} from "../lib/entities/writing-plan-options";
import {Section} from "../lib/section";

it("should extract sections", () => {

    const openMarker = "<test>";

    const isTextOpenMarker = isOpenMarker(openMarker, new WritingPlanOptions());
    const isTextOpenMarkerCLosed = isCloseMarker(openMarker, new WritingPlanOptions());

    expect(isTextOpenMarker).toBe(true);
    expect(isTextOpenMarkerCLosed).toBe(false);

    const closeMarker = "[/]"

    const isTextCloseMarker = isCloseMarker(closeMarker, new WritingPlanOptions({
        markerBegin: "[",
        markerEnd: "]"
    }));
    const isTextCloseMarkerOpen = isOpenMarker(closeMarker, new WritingPlanOptions({
        markerBegin: "[",
        markerEnd: "]"
    }));

    expect(isTextCloseMarker).toBe(true);
    expect(isTextCloseMarkerOpen).toBe(false);
});

it("market extractors", () => {
    // const sections = getSectionsFromText("<1000>\n<5.123>\n<>\n\nHello\n<500>", new WritingPlanOptions());

    // // console.log(JSON.stringify(sections, null, 2))
    // expect(sections.length).toBe(4);
    // // <1000>
    // expect(sections[0].setWordTarget).toBe(1000);
    // expect(sections[0].lineNumber).toBe(0);
    // // <5.123>
    // expect(sections[1].setWordTarget).toBe(5);
    // expect(sections[1].lineNumber).toBe(1);
    // // <>
    // expect(sections[2].setWordTarget).toBe(null);
    // expect(sections[2].lineNumber).toBe(2);
    // // <500>
    // expect(sections[3].setWordTarget).toBe(500);
    // expect(sections[3].lineNumber).toBe(5);

});

it("should extract section from text", () => {
    const marketWithNumbersOnly = "<1000>";
    const sectionWithNumbersOnly = new Section({
        marker: marketWithNumbersOnly
    },  new WritingPlanOptions());
    expect(sectionWithNumbersOnly.wordTarget).toBe(1000);

    const sectionTitle = "Section title";
    const marketWithSectionTitle = `<1000|${sectionTitle}>`;
    const sectionWithSectionTitle = new Section({
        marker: marketWithSectionTitle,
    },  new WritingPlanOptions());
    expect(sectionWithSectionTitle.title).toBe(sectionTitle);
});


