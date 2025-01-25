import { readExcelColumn } from "@/utils/excelReader";

async function main() {
  try {
    // 使用绝对路径读取邮箱数据
    const absolutePath =
      "/Users/mac/Desktop/Projects/Profile数据资源/Cursor相关/Cursor Team Users.xlsx";

    // 假设邮箱在 C 列，从 Sheet1 读取
    const emailData = readExcelColumn(absolutePath, "C", "Sheet1", true).slice(
      1,
    );
    console.log("团队成员邮箱列表:", emailData);

    // 输出邮箱总数
    console.log(`共读取到 ${emailData.length} 个邮箱地址`);
  } catch (error) {
    console.error("读取邮箱数据时出错:", error);
  }
}

main();
