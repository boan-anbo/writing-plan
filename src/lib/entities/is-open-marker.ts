import { WritingPlanOptions } from './writing-plan-options';

export const isOpenMarker = (
  line: string,
  options: WritingPlanOptions
): boolean => {
  const regex = options.getMarkerRegex();
  const match = line.match(regex);

  return match && !match[0].includes('/');
};
export const isCloseMarker = (
  line: string,
  options: WritingPlanOptions
): boolean => {
  const closeRegex = new RegExp(
    `${options.markerBegin}/${options.markerEnd}`,
    'g'
  );
  return closeRegex.test(line);
};
