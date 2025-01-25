import { readExcelColumn } from "@/utils/excelReader";

async function main() {
  try {
    // 1. 使用相对路径（相对于项目根目录）
    // const namesRelative = readExcelColumn('./data/employees.xlsx', 'C');
    // console.log('相对路径读取的数据:', namesRelative);

    // 2. 使用绝对路径
    const absolutePath =
      "/Users/mac/Desktop/Projects/Profile数据资源/Cursor相关/Cursor Team Users.xlsx";
    // const namesAbsolute = readExcelColumn(absolutePath, 'A', undefined, true);
    // console.log('绝对路径读取的数据:', namesAbsolute);

    // 3. 从特定工作表读取（使用绝对路径）
    const sheetData = readExcelColumn(absolutePath, "C", "Sheet1", true);
    console.log("指定工作表的数据:", sheetData);
  } catch (error) {
    console.error("处理Excel文件时出错:", error);
  }
}

main();
