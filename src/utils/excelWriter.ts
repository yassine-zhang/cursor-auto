import * as XLSX from "xlsx";
import { join } from "path";

interface ExcelData {
  [key: string]: string | number | null;
}

/**
 * 写入数据到Excel文件
 * @param filePath 文件保存路径（支持相对路径和绝对路径）
 * @param data 要写入的数据数组
 * @param sheetName 工作表名称（可选，默认为'Sheet1'）
 * @param headers 表头数组（可选）
 * @param isAbsolute 是否为绝对路径（可选，默认为false）
 */
export function writeExcelFile(
  filePath: string,
  data: ExcelData[],
  sheetName: string = "Sheet1",
  headers?: string[],
  isAbsolute: boolean = false,
): void {
  try {
    // 处理文件路径
    const actualPath = isAbsolute ? filePath : join(process.cwd(), filePath);

    // 如果提供了表头，将表头添加到数据中
    const workbookData = headers
      ? [
          headers.reduce((obj, header, index) => {
            obj[header] = header;
            return obj;
          }, {} as ExcelData),
        ].concat(data)
      : data;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(workbookData, {
      skipHeader: headers ? true : false,
    });

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 写入文件
    XLSX.writeFile(workbook, actualPath);

    console.log(`Excel文件已成功保存到: ${actualPath}`);
  } catch (error) {
    console.error("写入Excel文件失败:", error);
    throw error;
  }
}

/**
 * 向现有Excel文件添加新的工作表
 * @param filePath 现有Excel文件路径
 * @param data 要写入的数据数组
 * @param sheetName 新工作表名称
 * @param headers 表头数组（可选）
 * @param isAbsolute 是否为绝对路径（可选，默认为false）
 */
export function appendExcelSheet(
  filePath: string,
  data: ExcelData[],
  sheetName: string,
  headers?: string[],
  isAbsolute: boolean = false,
): void {
  try {
    // 处理文件路径
    const actualPath = isAbsolute ? filePath : join(process.cwd(), filePath);

    // 读取现有工作簿
    const workbook = XLSX.readFile(actualPath);

    // 如果工作表名已存在，添加数字后缀
    let finalSheetName = sheetName;
    let counter = 1;
    while (workbook.SheetNames.includes(finalSheetName)) {
      finalSheetName = `${sheetName}_${counter}`;
      counter++;
    }

    // 准备数据
    const workbookData = headers
      ? [
          headers.reduce((obj, header, index) => {
            obj[header] = header;
            return obj;
          }, {} as ExcelData),
        ].concat(data)
      : data;

    // 创建新工作表
    const worksheet = XLSX.utils.json_to_sheet(workbookData, {
      skipHeader: headers ? true : false,
    });

    // 将新工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);

    // 保存文件
    XLSX.writeFile(workbook, actualPath);

    console.log(
      `新工作表 "${finalSheetName}" 已添加到Excel文件: ${actualPath}`,
    );
  } catch (error) {
    console.error("添加工作表失败:", error);
    throw error;
  }
}

/**
 * 更新现有Excel工作表的数据
 * @param filePath Excel文件路径
 * @param data 要写入的数据数组
 * @param sheetName 工作表名称（如果不存在会创建新的）
 * @param headers 表头数组（可选）
 * @param isAbsolute 是否为绝对路径（可选，默认为false）
 * @param appendMode 是否为追加模式（可选，默认为false，即覆盖模式）
 */
export function updateExcelSheet(
  filePath: string,
  data: ExcelData[],
  sheetName: string,
  headers?: string[],
  isAbsolute: boolean = false,
  appendMode: boolean = false,
): void {
  try {
    // 处理文件路径
    const actualPath = isAbsolute ? filePath : join(process.cwd(), filePath);

    // 读取现有工作簿
    const workbook = XLSX.readFile(actualPath);

    // 准备数据
    const workbookData = headers
      ? [
          headers.reduce((obj, header) => {
            obj[header] = header;
            return obj;
          }, {} as ExcelData),
        ].concat(data)
      : data;

    let worksheet;

    if (workbook.SheetNames.includes(sheetName)) {
      if (appendMode) {
        // 追加模式：读取现有数据
        const existingWorksheet = workbook.Sheets[sheetName];
        const existingData = XLSX.utils.sheet_to_json(existingWorksheet);

        // 合并现有数据和新数据
        const combinedData = [...existingData, ...data];
        worksheet = XLSX.utils.json_to_sheet(combinedData, {
          skipHeader: false,
        });
      } else {
        // 覆盖模式：直接使用新数据
        worksheet = XLSX.utils.json_to_sheet(workbookData, {
          skipHeader: headers ? true : false,
        });
      }
    } else {
      // 工作表不存在，创建新的
      worksheet = XLSX.utils.json_to_sheet(workbookData, {
        skipHeader: headers ? true : false,
      });
    }

    // 更新或添加工作表
    workbook.Sheets[sheetName] = worksheet;

    // 如果是新工作表，添加到工作表名称列表
    if (!workbook.SheetNames.includes(sheetName)) {
      workbook.SheetNames.push(sheetName);
    }

    // 保存文件
    XLSX.writeFile(workbook, actualPath);

    console.log(`工作表 "${sheetName}" 已更新，文件保存在: ${actualPath}`);
  } catch (error) {
    console.error("更新工作表失败:", error);
    throw error;
  }
}
