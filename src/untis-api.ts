import axios, { AxiosInstance } from 'axios';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import querystring from 'querystring';
import {
    TimetablePeriod,
    StatusReturn,
    TimetablePeriodDetail,
    Timetable,
} from './types';

export interface AuthConfig {
    school: string;
    username: string;
    password: string;
}

export interface HttpClientConfig {
    baseURL?: string;
    accept?: string;
}

type ParsableDate = Date | number | string;

export class UntisAPI {
    constructor(
        private auth: AuthConfig,
        {
            baseURL = 'https://asopo.webuntis.com',
            accept = 'application/json',
        }: HttpClientConfig = {},
        private axiosClient: AxiosInstance = axios.create({
            baseURL,
            headers: {
                accept,
            },
        }),
    ) {}

    formatUntiTime(time: number | string): string {
        const timeString = time.toString();

        if (timeString.length === 3) {
            return `${'0' + timeString.slice(0, 1)}:${timeString.slice(1, 3)}`;
        } else if (timeString.length === 4) {
            return `${timeString.slice(0, 2)}:${timeString.slice(2, 4)}`;
        }

        throw new Error(
            'Invalid time provided. Time string must be 3 or 4 characters long',
        );
    }

    toUntisDate(date: ParsableDate, time?: string | number) {
        let monday;
        if (typeof date === 'number') {
            monday = parse(date.toString(), 'yyyyMMdd', new Date());
        } else {
            monday = new Date(date);
        }

        if (!time) {
            return format(monday, 'yyyy-MM-dd');
        }

        return `${format(monday, 'yyyy-MM-dd')}T${this.formatUntiTime(
            time,
        )}:00`;
    }

    makePeriodsHumanReadable(
        periods: TimetablePeriod[],
    ): StatusReturn<TimetablePeriod[]> {
        const localPeriods: TimetablePeriod[] = [...periods];
        let resultPeriods: TimetablePeriod[] = [];

        // Combines 2 Lesson right after each other into one
        let current = localPeriods.shift();
        while (current && localPeriods.length > 0) {
            let latestLesson = resultPeriods[resultPeriods.length - 1];

            if (latestLesson?.lessonNumber === current.lessonNumber) {
                latestLesson.endTime = current.endTime;
            } else {
                resultPeriods.push(current);
            }

            current = localPeriods.shift();
        }

        return {
            ok: true,
            data: resultPeriods,
        };
    }

    async authorize(): Promise<StatusReturn<boolean>> {
        const requestData = querystring.stringify({
            school: this.auth.school,
            j_username: this.auth.username,
            j_password: this.auth.password,
            token: '',
        });

        let sessionResponse;
        try {
            sessionResponse = await this.axiosClient.post(
                '/WebUntis/j_spring_security_check',
                requestData,
            );
        } catch (error) {
            return { ok: false, error: error.message };
        }

        if (sessionResponse.data.state !== 'SUCCESS') {
            return {
                ok: false,
                error: 'Invalid credentials',
            };
        }

        const requestCookies: { [key: string]: string } = {};
        sessionResponse.headers['set-cookie'].forEach((cookieText: string) => {
            const [key, other] = cookieText.split('=');

            requestCookies[key] = other.split(';')[0];
        });

        let cookieString = `JSESSIONID=${requestCookies['JSESSIONID']}; schoolname=${requestCookies['schoolname']}; `;
        const { data: bearerToken } = await this.axiosClient.get(
            '/WebUntis/api/token/new',
            {
                headers: {
                    Cookie: cookieString,
                },
            },
        );

        this.axiosClient.defaults.headers.Cookie = cookieString;
        this.axiosClient.defaults.headers.Authorization = `Bearer ${bearerToken}`;

        return { ok: true, data: true };
    }

    async getTimetable(
        timeTableId: number,
        date: ParsableDate,
    ): Promise<StatusReturn<Timetable>> {
        const query = querystring.stringify({
            elementType: 5,
            elementId: timeTableId,
            date: this.toUntisDate(date),
            formatId: 2,
        });

        let timetableResponse;
        try {
            timetableResponse = await this.axiosClient.get(
                `/WebUntis/api/public/timetable/weekly/data?${query}`,
            );
        } catch (error) {
            return { ok: false, error: error.message };
        }

        const {
            error: responseError,
            result: { data: responseData },
        } = timetableResponse.data?.data;

        if (responseError) {
            return { ok: false, error: responseError };
        }

        if (!responseData) {
            return {
                ok: false,
                error: `No response dat in API response: ${timetableResponse.data}`,
            };
        }

        const {
            elementPeriods: { [timeTableId]: periods },
            elements: subjects,
        } = responseData;

        return {
            ok: true,
            data: {
                timeTableId,
                periods: periods ?? [],
                subjects: subjects ?? [],
            },
        };
    }

    async getPeriods(
        timeTableId: number,
        date: ParsableDate,
        humanReadable: boolean = false,
    ): Promise<StatusReturn<TimetablePeriod[]>> {
        const {
            ok: rawTimeTableDataOk,
            data: rawTimetableData,
            error: rawTimeTableDataError,
        } = await this.getTimetable(timeTableId, date);

        if (!rawTimeTableDataOk) {
            return { ok: false, error: rawTimeTableDataError };
        }

        const periods = rawTimetableData!.periods;

        if (humanReadable) {
            const {
                ok: humanReadableOk,
                data: humanReadablePeriods,
                error: humanReadableError,
            } = this.makePeriodsHumanReadable(periods);
            if (!humanReadableOk) {
                return { ok: false, error: humanReadableError };
            }

            return {
                ok: rawTimeTableDataOk,
                data: humanReadablePeriods,
                error: rawTimeTableDataError,
            };
        }

        return {
            ok: rawTimeTableDataOk,
            data: periods,
            error: rawTimeTableDataError,
        };
    }

    async getPeriodDetail(
        timeTableId: number,
        period: TimetablePeriod,
    ): Promise<StatusReturn<TimetablePeriodDetail>> {
        const query = querystring.stringify({
            elementId: timeTableId,
            elementType: 5,
            startDateTime: this.toUntisDate(period.date, period.startTime),
            endDateTime: this.toUntisDate(period.date, period.endTime),
        });

        let periodDetailResponse;
        try {
            periodDetailResponse = await this.axiosClient.get(
                `/WebUntis/api/rest/view/v1/calendar-entry/detail?${query}`,
            );
        } catch (error) {
            return {
                ok: false,
                error: `Could not fetch period detail: ${error}`,
            };
        }

        return {
            ok: true,
            data: periodDetailResponse.data
                .calendarEntries[0] as TimetablePeriodDetail,
        };
    }
}
