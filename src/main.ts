import {startOfWeek, sub} from 'date-fns';
import {StatusReturn, Timetable} from './types';
import {UntisAPI} from './untis-api';
import PromptSync from 'prompt-sync';
import * as fs from 'fs';

const prompt = PromptSync({sigint: true});

const envKeys = ["UNTIS_SCHOOL_NAME", "UNTIS_USERNAME", "UNTIS_PASSWORD", "UNTIS_TIME_TABLE_ID"];
envKeys.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`"${key}" is not defined in the environemnt. Have you created a .env?`)
    }
})

const untisAPI = new UntisAPI({
    school: process.env.UNTIS_SCHOOL_NAME!,
    username: process.env.UNTIS_USERNAME!,
    password: process.env.UNTIS_PASSWORD!,
});

let retVal = '';

export async function weeklyReport(
    timetable: Timetable,
    subjectSpacing: string = '',
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

        if (periodDetails.type !== 'NORMAL_TEACHING_PERIOD') {
            continue;
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
    return sub(startOfWeek(new Date(), {weekStartsOn: 2}), {weeks});
}

async function run() {
    const timeTableId = parseInt(process.env.UNTIS_TIME_TABLE_ID!, 10);
    const {ok: authOk, error: authError} = await untisAPI.authorize();
    if (!authOk) {
        throw new Error(authError);
    }

    let weeksAgoArg = parseInt(process.argv[2])

    const auto = true

    while (weeksAgoArg > -1) {
        const date = nWeeksAgo(weeksAgoArg || 0);

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

        retVal += `${date.toUTCString()}\n\n${report}\n\n\n\n\n\n`;
        console.log(
            `
${weeksAgoArg} weeks ago [${date.toUTCString()}]

${report}

`
        )
        weeksAgoArg--
        if (weeksAgoArg < 0) {
            break;
        }

        if (!auto) {
            const answer = prompt(`Show next week? [Y/n]`)
            if (answer === "n") {
                break;
            }
        }
    }

    fs.writeFile('report.txt', retVal, (val) => console.log(val));
}

run();
