
import { GoogleGenAI } from "@google/genai";
import { LessonInfo, ProcessingOptions } from "../types";
import { SYSTEM_INSTRUCTION, NLS_FRAMEWORK_DATA } from "../constants";

export const generateNLSLessonPlan = async (
  info: LessonInfo,
  options: ProcessingOptions
): Promise<string> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API_KEY in environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const modelId = "gemini-2.5-flash"; 
  
  let distributionContext = "";
  if (info.distributionContent && info.distributionContent.trim().length > 0) {
      distributionContext = `
      =========================================================
      🚨 QUY TẮC TUÂN THỦ PPCT (STRICT MODE):
      Người dùng đã cung cấp Phân phối chương trình (PPCT).
      1. Tìm bài học tương ứng trong PPCT.
      2. Trích xuất NGUYÊN VĂN nội dung cột "Năng lực số" của bài học đó.
      3. Đối chiếu các hoạt động dạy học với NLS trong PPCT.
      4. Chỉ được phép phân tích các mã NLS có trong PPCT cho bài học này.
      
      NỘI DUNG PPCT:
      ${info.distributionContent}
      =========================================================
      `;
  }

  const userPrompt = `
    DỮ LIỆU ĐỂ BẠN TRA CỨU (KHÔNG ĐƯỢC LẶP LẠI TRONG KẾT QUẢ):
    ${NLS_FRAMEWORK_DATA}

    THÔNG TIN GIÁO ÁN ĐẦU VÀO:
    - Bộ sách: ${info.textbook}
    - Môn học: ${info.subject}
    - Khối lớp: ${info.grade}
    
    ${distributionContext}

    YÊU CẦU ĐẶC BIỆT:
    1. TÍCH HỢP HOẠT ĐỘNG: Chèn thêm các hành động số vào tiến trình (dùng <u>...</u> và bọc trong span color red).
    2. PHÂN TÍCH CHI TIẾT: Dưới mỗi Hoạt động, hãy viết mục "**Phát triển Năng lực số (NLS):**" (bọc trong div color red) liệt kê Mã, Thành phần và Biểu hiện cụ thể của HS.
    3. CẢNH BÁO QUAN TRỌNG: Tuyệt đối KHÔNG in lại danh sách "6 MIỀN NĂNG LỰC SỐ" hay "DỮ LIỆU YCCD" mẫu vào giáo án. Chỉ trả về bản giáo án đã tích hợp hoàn chỉnh.
    
    ${options.detailedReport ? "- Cuối bài hãy tổng hợp bảng danh mục các mã năng lực số đã sử dụng trong giáo án này." : ""}
    
    NỘI DUNG GIÁO ÁN GỐC CẦN XỬ LÝ:
    ${info.content}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
      contents: userPrompt,
    });

    const text = response.text;
    if (!text) {
        throw new Error("API trả về kết quả rỗng.");
    }
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.");
  }
};
