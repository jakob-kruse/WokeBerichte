import { startOfWeek, sub } from 'date-fns';
import { off } from 'node:process';
import { StatusReturn, Timetable } from './types';
import { UntisAPI } from './untis-api';

const untisAPI = new UntisAPI({
    school: process.env.SCHOOL_NAME!,
    username: process.env.USERNAME!,
    password: process.env.PASSWORD!,
});

export async function weeklyReport(
    timetable: Timetable,
    subjectSpacing: string = '\n',
): Promise<StatusReturn<string>> {
    const teachingContents: { [key: string]: string[] } = {};

    const {
        ok: humanPeriodsOk,
        data: periods,
        error: humanPeriodsError,
    } = untisAPI.makePeriodsHumanReadable(timetable.periods);
    if (!humanPeriodsOk || !periods) {
        return {
            ok: false,
            error: 'Failed making periods human readable: ' + humanPeriodsError,
        };
    }

    for await (const period of periods) {
        const {
            ok: periodDetailsOk,
            data: periodDetails,
            error: periodDetailsError,
        } = await untisAPI.getPeriodDetail(timetable.timeTableId, period);
        if (!periodDetailsOk || !periodDetails) {
            return {
                ok: false,
                error: `Failed fetching period detail: ${periodDetailsError}`,
            };
        }

        const subjectName = periodDetails.subject.shortName;
        const teachingContentEntries = teachingContents[subjectName];

        const teachingContent =
            periodDetails.teachingContent?.split('\n') ?? [];
        if (!teachingContentEntries) {
            teachingContents[subjectName] = [...teachingContent];
        } else {
            teachingContents[subjectName].push(...teachingContent);
        }
    }

    const isEmpty = Object.values(teachingContents).every((t) => !t.length);
    if (isEmpty) {
        return {
            ok: true,
            data: 'No Teaching content available',
        };
    }

    const resultString: string[] = [];
    Object.entries(teachingContents).forEach(([subject, contents]) => {
        if (contents.length > 0) {
            resultString.push(subject);

            contents.forEach((content) => {
                if (content) {
                    const text = `- ${content.replace(/-/g, '').trim()}`;

                    if (!resultString.includes(text)) {
                        resultString.push(text);
                    }
                }
            });
            resultString.push(subjectSpacing);
        }
    });

    return {
        ok: true,
        data: resultString.join('\n'),
    };
}

function nWeeksAgo(weeks: number) {
    return sub(startOfWeek(new Date(), { weekStartsOn: 2 }), { weeks });
}

async function run() {
    const timeTableId = 4138;
    const date = nWeeksAgo(0);

    const { ok: authOk, error: authError } = await untisAPI.authorize();
    if (!authOk) {
        throw new Error(authError);
    }

    const {
        ok: timeTableDataOk,
        data: timeTable,
        error: timeTableError,
    } = await untisAPI.getTimetable(timeTableId, untisAPI.toUntisDate(date));
    if (!timeTableDataOk || !timeTable) {
        throw new Error('Could not get Timetable: ' + timeTableError);
    }

    const {
        ok: reportOk,
        data: report,
        error: reportError,
    } = await weeklyReport(timeTable);
    if (!reportOk || report === undefined) {
        throw new Error('Could not create report: ' + reportError);
    }
    console.log(report);
}

run();
