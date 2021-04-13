export type SubjectShortName = string;
export type SubjectLongName = string;

export interface StatusReturn<DataType = undefined, ErrorType = string> {
    ok: boolean;
    data?: DataType;
    error?: ErrorType;
}

export interface Timetable {
    timeTableId: number;
    periods: TimetablePeriod[];
    subjects: any[];
}

export interface TimetablePeriod {
    id: number;
    lessonId: number;
    lessonNumber: number;
    lessonCode: 'UNTIS_LESSON' | string;
    lessonText: string;
    periodText: string;
    hasPeriodText: boolean;
    periodInfo: string;
    periodAttachments: [];
    staffText: string;
    staffAttachments: [];
    videoCall: { videoCallUrl: string | null; active: boolean };
    substText: string;
    date: number;
    startTime: number;
    endTime: number;
    elements: any[];
    hasInfo: boolean;
    code: number;
    cellState: 'STANDARD' | string;
    priority: number;
    is: { standard: boolean; event: boolean };
    roomCapacity: number;
    studentCount: number;
}

export interface PeriodTeacher {
    id: number;
    status: string;
    shortName: string;
    longName: string;
    displayName: string;
}

export interface PeriodRoom {
    id: number;
    shortName: string;
    longName: string;
    displayName: string;
    status: string;
}

export interface PeriodClass {
    id: number;
    shortName: string;
    longName: string;
    displayName: string;
}

export interface PeriodSubject {
    id: number;
    shortName: string;
    longName: string;
    displayName: string;
}

export interface TimetablePeriodDetail {
    id: number;
    lesson: { lessonId: number; lessonNumber: number };
    startDateTime: string;
    endDateTime: string;
    type: 'NORMAL_TEACHING_PERIOD' | string;
    subType: { id: number; displayName: string };
    status: 'TAKING_PLACE' | string;
    originalCalendarEntry: null;
    teachers: PeriodTeacher[];
    rooms: PeriodRoom[];
    klasses: PeriodClass[];
    subject: PeriodSubject;
    exam: null;
    absenceReasonId: null;
    color: null;
    mainStudentGroup: null;
    students: [];
    resources: [];
    notesAll: null;
    notesAllFiles: [];
    notesStaff: null;
    notesStaffFiles: [];
    videoCall: null;
    teachingContent: string;
    teachingContentFiles: [];
    messengerChannel: null;
    substText: null;
    lessonInfo: null;
    booking: null;
    permissions: string[];
    singleEntries: [];
}
