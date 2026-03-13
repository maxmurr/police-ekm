import { customAlphabet } from "nanoid";

const prefixes = {
  student: "stu",
  guardian: "grd",
  studyPlan: "spl",
  enrollment: "enr",
  subject: "sub",
  academicYear: "ayr",
  leaveType: "lvt",
  foodCategory: "fct",
  foodMenu: "fmn",
  foodSource: "fsr",
  sicknessType: "skt",
  scoring: "scr",
  attendance: "att",
  foodTransaction: "ftr",
  firstAidRoom: "far",
  libraryVisit: "lib",
  // Police schema prefixes
  investigator: "inv",
  incidentReport: "inc",
  incidentReportLegacy: "ilg",
  // St. Gabriel schema prefixes
  stgabrielStudent: "stg",
  // Cache prefixes
  queryResultCache: "qrc",
};

interface GenerateIdOptions {
  /**
   * The length of the generated ID.
   * @default 16
   * @example 16 => "abc123def456ghi7"
   * */
  length?: number;
  /**
   * The separator to use between the prefix and the generated ID.
   * @default "_"
   * @example "_" => "str_abc123"
   * */
  separator?: string;
}

/**
 * Generates a unique ID with a given prefix.
 * @param prefix The prefix to use for the generated ID.
 * @param options The options for generating the ID.
 * @example
 * generateId("student") => "stu_abc123def456"
 * generateId("student", { length: 8 }) => "stu_abc123d"
 * generateId("student", { separator: "-" }) => "stu-abc123def456"
 */
export function generateId(prefix?: keyof typeof prefixes, { length = 12, separator = "_" }: GenerateIdOptions = {}) {
  const id = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", length)();
  return prefix ? `${prefixes[prefix]}${separator}${id}` : id;
}
