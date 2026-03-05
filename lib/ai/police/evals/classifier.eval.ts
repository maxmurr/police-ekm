import { evalite } from "evalite";
import { unifiedRouter } from "../unified-router";
import "dotenv/config";

export interface PoliceTestCase {
  id: number;
  input: string;
  expected: "information" | "general";
  category: string;
  complexity: "simple" | "medium" | "complex";
}

export const policeDataset: PoliceTestCase[] = [
  // ========================================
  // INFORMATION QUERIES - Simple (5 questions)
  // ========================================
  {
    id: 1,
    input: "เดือนนี้มีคดีลักทรัพย์กี่คดี และมูลค่าความเสียหายรวมเท่าไร",
    expected: "information",
    category: "การนับจำนวนคดี",
    complexity: "simple",
  },
  {
    id: 2,
    input: "แสดงคดีบัญชีม้าทั้งหมดที่มูลค่าความเสียหายเกิน 100,000 บาท",
    expected: "information",
    category: "การกรองข้อมูล",
    complexity: "simple",
  },
  {
    id: 3,
    input: "เขตบางกะปิมีคดีอะไรบ้างในเดือน 8",
    expected: "information",
    category: "การค้นหาตามพื้นที่",
    complexity: "simple",
  },
  {
    id: 4,
    input: "เขตจตุจักรกับเขตบางกะปิ เขตไหนมีคดีลักทรัพย์มากกว่ากัน",
    expected: "information",
    category: "การเปรียบเทียบ",
    complexity: "simple",
  },
  {
    id: 5,
    input: "เปรียบเทียบจำนวนคดีฉ้อโกงระหว่างเขตคลองเตยและเขตดินแดง",
    expected: "information",
    category: "การเปรียบเทียบ",
    complexity: "simple",
  },

  // ========================================
  // INFORMATION QUERIES - Medium (5 questions)
  // ========================================
  {
    id: 6,
    input: "แสดงรายชื่อผู้สืบสวนที่รับผิดชอบคดีในเขตบางกะปิ พร้อมจำนวนคดีที่รับผิดชอบและยศของแต่ละคน",
    expected: "information",
    category: "การรวมข้อมูลหลายตาราง",
    complexity: "medium",
  },
  {
    id: 7,
    input: "คดีไหนบ้างที่มีผู้เสียหายมากกว่า 3 คน และยังไม่ปิดคดี พร้อมแสดงชื่อผู้สืบสวน",
    expected: "information",
    category: "การกรองและรวมข้อมูล",
    complexity: "medium",
  },
  {
    id: 8,
    input: "หาคดีทั้งหมดที่เกิดในสถานที่ประเภท 'mall' และมีมูลค่าความเสียหายเกิน 50,000 บาท เรียงตามวันที่",
    expected: "information",
    category: "การกรองและเรียงลำดับ",
    complexity: "medium",
  },
  {
    id: 9,
    input: "เดือน 7 กับเดือน 8 เดือนไหนมีคดีบัญชีม้ามากกว่ากัน แสดงจำนวนคดีและมูลค่าความเสียหายของแต่ละเดือน",
    expected: "information",
    category: "การเปรียบเทียบช่วงเวลา",
    complexity: "medium",
  },
  {
    id: 10,
    input: "แสดงคดีที่เกิดในช่วง 7 วันที่ผ่านมา พร้อมสถานะและเวลาตอบสนองของแต่ละคดี",
    expected: "information",
    category: "การคำนวณและกรอง",
    complexity: "medium",
  },

  // ========================================
  // INFORMATION QUERIES - Complex (10 questions)
  // ========================================
  {
    id: 11,
    input:
      "วิเคราะห์คดีลักทรัพย์ในเขตจตุจักร ให้ข้อมูล: จำนวนคดีทั้งหมด, มูลค่าความเสียหายเฉลี่ย, คดีที่ปิดแล้วกี่คดี, ผู้สืบสวนที่รับผิดชอบมีใครบ้าง, และสถานที่ที่เกิดเหตุบ่อยที่สุด 3 อันดับแรก",
    expected: "information",
    category: "การวิเคราะห์แบบหลายมิติ",
    complexity: "complex",
  },
  {
    id: 12,
    input:
      "เปรียบเทียบคดีฉ้อโกงกับคดีบัญชีม้าในเดือนนี้ ให้ข้อมูล: จำนวนคดี, มูลค่าความเสียหายรวมและเฉลี่ย, เขตที่เกิดเหตุมากที่สุดของแต่ละประเภท, และอัตราการปิดคดี",
    expected: "information",
    category: "การเปรียบเทียบประเภทคดี",
    complexity: "complex",
  },
  {
    id: 13,
    input:
      "หาผู้สืบสวนที่มีประสิทธิภาพสูงสุด โดยดูจาก: จำนวนคดีที่ปิดสำเร็จ, เวลาเฉลี่ยในการปิดคดี, และประเภทคดีที่รับผิดชอบ พร้อมแสดง top 5 อันดับ",
    expected: "information",
    category: "การวิเคราะห์ประสิทธิภาพ",
    complexity: "complex",
  },
  {
    id: 14,
    input:
      "วิเคราะห์แนวโน้มคดีบัญชีม้าในช่วง 3 เดือนที่ผ่��นมา (มิถุนายน กรกฎาคม สิงหาคม) พร้อมแสดงมูลค่าความเสียหายรวมแต่ละเดือน, เขตที่พบคดีมากที่สุดในแต่ละเดือน, และความรุนแรงของคดี",
    expected: "information",
    category: "การวิเคราะห์แนวโน้ม",
    complexity: "complex",
  },
  {
    id: 15,
    input:
      "หาคดีที่น่าสงสัย ที่มีมูลค่าความเสียหายสูงกว่าค่าเฉลี่ยของประเภทคดีนั้นๆ อย่างน้อย 2 เท่า และมีผู้ต้องสงสัยมากกว่า 3 คน แสดงรายละเอียดคดี ชื่อผู้สืบสวน และสถานะปัจจุบัน",
    expected: "information",
    category: "การตรวจจับความผิดปกติ",
    complexity: "complex",
  },
  {
    id: 16,
    input:
      "สรุปภาพรวมระบบงานของสถานีตำรวจ: คดีที่รออยู่กี่คดี, ผู้สืบสวนที่กำลังทำงานกี่คน, คดีที่ปิดในเดือนนี้กี่คดี, ประเภทคดีที่เกิดบ่อยที่สุด 5 อันดับพร้อมจำนวน, และเขตที่มีปัญหามากที่สุด 3 เขต",
    expected: "information",
    category: "การสรุปภาพรวมระบบ",
    complexity: "complex",
  },
  {
    id: 17,
    input:
      "วิเคราะห์ความสัมพันธ์ระหว่างเวลาตอบสนองกับอัตราการปิดคดี แยกตามประเภทคดี และแสดงว่าประเภทคดีไหนมีเวลาตอบสนองเร็วที่สุดและช้าที่สุด พร้อมเปอร์เซ็นต์การปิดคดีของแต่ละประเภท",
    expected: "information",
    category: "การวิเคราะห์ความสัมพันธ์",
    complexity: "complex",
  },
  {
    id: 18,
    input:
      "หาคดีที่เกิดในพื้นที่เดียวกัน (location_general ตรงกัน) มากกว่า 2 ครั้งในเดือนนี้ แสดงว่าสถานที่ไหนบ้างและเกิดคดีประเภทอะไร",
    expected: "information",
    category: "การวิเคราะห์พื้นที่เสี่ยง",
    complexity: "complex",
  },
  {
    id: 19,
    input:
      "เปรียบเทียบประสิทธิภาพการทำงานระหว่างผู้สืบสวนยศต่างกัน โดยดูเฉพาะยศ 'พ.ต.ท.' กับ 'ร.ต.อ.' ว่าใครปิดคดีได้เร็วกว่ากัน และรับผิดชอบคดีประเภทไหนบ้าง",
    expected: "information",
    category: "การเปรียบเทียบตามยศ",
    complexity: "complex",
  },
  {
    id: 20,
    input:
      "หาคดีที่มีความผิดปกติ: มีจำนวนผู้ต้องสงสัยมากแต่มูลค่าความเสียหายน้อย หรือมูลค่าความเสียหายมากแต่ไม่มีผู้ต้องสงสัย พร้อมแสดงรายละเอียดและเหตุผลที่น่าสงสัย",
    expected: "information",
    category: "การตรวจจับความผิดปกติ",
    complexity: "complex",
  },

  // ========================================
  // GENERAL QUERIES - Simple (5 questions)
  // ========================================
  {
    id: 21,
    input: "สวัสดีครับ",
    expected: "general",
    category: "การทักทาย",
    complexity: "simple",
  },
  {
    id: 22,
    input: "ขอบคุณมากครับ",
    expected: "general",
    category: "การขอบคุณ",
    complexity: "simple",
  },
  {
    id: 23,
    input: "คุณช่วยอะไรฉันได้บ้าง",
    expected: "general",
    category: "คำถามเกี่ยวกับความสามารถ",
    complexity: "simple",
  },
  {
    id: 24,
    input: "วันนี้อากาศดีจัง",
    expected: "general",
    category: "การสนทนาทั่วไป",
    complexity: "simple",
  },
  {
    id: 25,
    input: "ระบบนี้ทำงานยังไง",
    expected: "general",
    category: "คำถามเกี่ยวกับระบบ",
    complexity: "simple",
  },

  // ========================================
  // GENERAL QUERIES - Medium (5 questions)
  // ========================================
  {
    id: 26,
    input: "อธิบายให้ฟังหน่อยว่าระบบนี้มีฟีเจอร์อะไรบ้าง",
    expected: "general",
    category: "คำถามเกี่ยวกับฟีเจอร์",
    complexity: "medium",
  },
  {
    id: 27,
    input: "วิธีการบันทึกคดีใหม่ทำอย่างไร",
    expected: "general",
    category: "คำถามเกี่ยวกับวิธีใช้งาน",
    complexity: "medium",
  },
  {
    id: 28,
    input: "ฉันต้องการความช่วยเหลือในการใช้งานระบบ",
    expected: "general",
    category: "การขอความช่วยเหลือ",
    complexity: "medium",
  },
  {
    id: 29,
    input: "ระบบนี้มีข้อจำกัดอะไรบ้าง",
    expected: "general",
    category: "คำถามเกี่ยวกับข้อจำกัด",
    complexity: "medium",
  },
  {
    id: 30,
    input: "มีวิธีส่งออกรายงานเป็น PDF ไหม",
    expected: "general",
    category: "คำถามเกี่ยวกับการส่งออกข้อมูล",
    complexity: "medium",
  },

  // ========================================
  // GENERAL QUERIES - Complex (5 questions)
  // ========================================
  {
    id: 31,
    input:
      "ช่วยอธิบายให้ฟังหน่อยว่าระบบจัดการคดีนี้ทำงานอย่างไร และมีฟีเจอร์อะไรบ้างที่ช่วยให้การทำงานของเจ้าหน้าที่สะดวกขึ้น",
    expected: "general",
    category: "คำถามเชิงอธิบายระบบ",
    complexity: "complex",
  },
  {
    id: 32,
    input: "ฉันเป็นผู้ใช้ใหม่ ต้องการเรียนรู้วิธีใช้งานระบบตั้งแต่เริ่มต้น มีคู่มือหรือขั้นตอนการใช้งานไหม",
    expected: "general",
    category: "การขอคำแ��ะนำสำหรับผู้ใช้ใหม่",
    complexity: "complex",
  },
  {
    id: 33,
    input: "ระบบนี้สามารถรองรับการทำงานกับหน่วยงานอื่นได้ไหม เช่น การแลกเปลี่ยนข้อมูลระหว่างสถานีตำรวจ",
    expected: "general",
    category: "คำถามเกี่ยวกับการบูรณาการ",
    complexity: "complex",
  },
  {
    id: 34,
    input: "มีมาตรการรักษาความปลอดภัยของข้อมูลอย่างไร และใครบ้างที่สามารถเข้าถึงข้อมูลได้",
    expected: "general",
    category: "คำถามเกี่ยวกับความปลอดภัย",
    complexity: "complex",
  },
  {
    id: 35,
    input: "หากระบบเกิดปัญหาหรือข้อมูลหายควรทำอย่างไร และมีการสำรองข้อมูลไหม",
    expected: "general",
    category: "คำถามเกี่ยวกับการแก้ไขปัญหา",
    complexity: "complex",
  },

  // ========================================
  // EDGE CASES - Ambiguous queries (5 questions)
  // ========================================
  {
    id: 36,
    input: "มีคดีอะไรบ้าง",
    expected: "information",
    category: "คำถามคลุมเครือ",
    complexity: "simple",
  },
  {
    id: 37,
    input: "บอกข้อมูลให้หน่อย",
    expected: "general",
    category: "คำถามไม่ชัดเจน",
    complexity: "simple",
  },
  {
    id: 38,
    input: "สถิติล่าสุดเป็นยังไง",
    expected: "information",
    category: "คำถามแบบกว้าง",
    complexity: "simple",
  },
  {
    id: 39,
    input: "มีอะไรใหม่ไหม",
    expected: "general",
    category: "คำถามทั่วไป",
    complexity: "simple",
  },
  {
    id: 40,
    input: "ช่วยหน่อย",
    expected: "general",
    category: "การขอความช่วยเหลือทั่วไป",
    complexity: "simple",
  },
];

evalite("Police Classifier - Question Classification", {
  data: policeDataset.map((testCase) => ({
    input: testCase.input,
    expected: testCase.expected,
  })),
  task: async (input) => {
    const result = await unifiedRouter({
      messages: [{ role: "user", content: input }],
    });

    return result.queryType;
  },
  scorers: [
    {
      name: "Accuracy",
      description: "Returns 1 for correct classification, 0 for incorrect classification",
      scorer: ({ output, expected }) => {
        return output === expected ? 1 : 0;
      },
    },
  ],
});
