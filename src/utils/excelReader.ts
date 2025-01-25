import * as XLSX from "xlsx";
import { join } from "path";

interface ExcelRow {
  [key: string]: string | number | null;
}

/**
 * 从Excel文件中读取指定列的数据
 * @param filePath Excel文件路径（支持相对路径和绝对路径）
 * @param columnName 列名（如：'A'或实际的列标题）
 * @param sheetName 工作表名称（可选，默认读取第一个工作表）
 * @param isAbsolute 是否为绝对路径（可选，默认为false）
 * @returns 返回指定列的数据数组
 */
export function readExcelColumn(
  filePath: string,
  columnName: string,
  sheetName?: string,
  isAbsolute: boolean = false,
): string[] {
  try {
    // 处理文件路径
    const actualPath = isAbsolute ? filePath : join(process.cwd(), filePath);

    // 读取Excel文件
    const workbook = XLSX.readFile(actualPath);

    // 获取工作表名称
    const sheet = sheetName
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];

    // 将工作表转换为JSON对象
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { header: "A" });

    // 如果columnName是字母（如'A'，'B'等），直接使用
    // 如果是列标题名，需要找到对应的列字母
    let targetColumn = columnName;
    if (!/^[A-Z]$/.test(columnName)) {
      // 获取表头行
      const headerRow = jsonData[0] as ExcelRow;
      // 查找列标题对应的列字母
      for (const [key, value] of Object.entries(headerRow)) {
        if (value === columnName) {
          targetColumn = key;
          break;
        }
      }
    }

    // 提取指定列的数据
    const columnData = jsonData
      .slice(1) // 跳过表头行
      .map((row: ExcelRow) => String(row[targetColumn] || ""))
      .filter(Boolean); // 过滤掉空值

    return columnData;
  } catch (error) {
    console.error("读取Excel文件失败:", error);
    throw error;
  }
}

/**
 * 示例使用方法：
 *
 * // 通过列字母读取
 * const dataByLetter = readExcelColumn('./example.xlsx', 'A');
 *
 * // 通过列标题读取
 * const dataByHeader = readExcelColumn('./example.xlsx', '姓名');
 *
 * // 指定工作表名称
 * const dataFromSheet = readExcelColumn('./example.xlsx', 'A', 'Sheet2');
 */
