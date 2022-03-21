import { WritingPlanOptions } from "../lib/entities/writing-plan-options";
import WritingPlan from '../lib/writing-plan';

it('Get document info', () => {
    const text = 'Writing\nPlan';
    const lib = new WritingPlan(text);

    expect(lib.info.lines).toBe(2);
    expect(lib.info.rawLength).toBe(text.length);
});

it('If document has plan with default options', () => {
    const libHasPlan = new WritingPlan(`Hello\nWorld\n<1000></>`);

    expect(libHasPlan.info.hasPlan).toBeTruthy();

    // expect throw error
    expect(() => {
        // try incorrect tags
        new WritingPlan(`Hello\nWorld<1000</>`);
    }).toThrowError();

    const libHasNoPlan = new WritingPlan(`Hello\nWorld`);
    expect(libHasNoPlan.info.hasPlan).toBeFalsy();
});

it('should tell if document has plan with customized markers', () => {
    const libHasPlan = new WritingPlan(`Hello\nWorld\n{{1000}}{{/}}`, new WritingPlanOptions({
        markerBegin: '{{',
        markerEnd: '}}'
    }));
    expect(libHasPlan.info.hasPlan).toBeTruthy();

    const libHasNoPlan = new WritingPlan(`Hello\nWorld\n{{1000}`, new WritingPlanOptions({
        markerBegin: '{{',
        markerEnd: '}}'
    }));

    expect(libHasNoPlan.info.hasPlan).toBeFalsy();

    // check if regex meaningful characters such as [ is escaped

    const libHasPlanEspcape = new WritingPlan(`Hello\nWorld\n[1000][/]`, new WritingPlanOptions({
        markerBegin: '[',
        markerEnd: ']'
    }));
    expect(libHasPlanEspcape.info.hasPlan).toBeTruthy();

    // expect throw error
    expect(() => {
        // try incorrect tags
        new WritingPlan(`Hello\nWorld\n[1000[/]`, new WritingPlanOptions({
            markerBegin: '[',
            markerEnd: ']'
        }));
    }).toThrowError();



});


