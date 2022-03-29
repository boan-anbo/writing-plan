import WritingPlan from '../writing-plan';


export const generateUniqueSectionId = (plan: WritingPlan, baseNumber?: number): string => {
  const hasBaseNumber = (baseNumber !== undefined && baseNumber !== null);

  if (!hasBaseNumber) {
    baseNumber = 0;
  }

  let idCandidate = new Date().toISOString();

  idCandidate = idCandidate + baseNumber;

  const hasId = plan.hasSectionId(idCandidate);

  // console.log('hasId', hasId, idCandidate);

  // otherwise set interval to wait for a milisecond and try again
  if (hasId) {
    return generateUniqueSectionId(plan, baseNumber + 1);
  } else {
    return idCandidate;
  }
};
