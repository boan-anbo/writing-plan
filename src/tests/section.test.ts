import WritingPlan from '../lib/writing-plan';

it('should get section marker', () => {
  const text = "<1000>\n</>";

  const plan = new WritingPlan(text);

  const markers = plan.sections[0].getMarkerMatch();
  expect(markers.length).toBe(2);
  expect(markers[0].marker).toBe("<1000>");
  expect(markers[0].isOpenMarker).toBe(true);
  expect(markers[0].isCloseMarker).toBe(false);
  expect(markers[0].markerLength).toBe(6);
  expect(markers[0].markerLine).toBe(0);
  expect(markers[0].markerEndIndex).toBe(5);
  expect(markers[1].marker).toBe("</>");
  expect(markers[1].isOpenMarker).toBe(false);
  expect(markers[1].markerLine).toBe(1);
  expect(markers[1].markerEndIndex).toBe(2);


})
