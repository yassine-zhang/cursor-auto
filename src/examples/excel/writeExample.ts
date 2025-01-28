import { writeExcelFile, appendExcelSheet } from "@/utils/excelWriter";

async function main() {
  try {
    // 示例数据
    const data = [
      { name: "张三", email: "zhangsan@example.com", age: 25 },
      { name: "李四", email: "lisi@example.com", age: 30 },
    ];

    // 表头
    const headers = ["name", "email", "age"];

    // 1. 创建新的Excel文件
    writeExcelFile("./data/output.xlsx", data, "Users", headers, false);

    // 2. 向现有文件添加新工作表
    const newData = [
      { department: "技术部", count: 10 },
      { department: "市场部", count: 5 },
    ];

    appendExcelSheet(
      "./data/output.xlsx",
      newData,
      "Departments",
      ["department", "count"],
      false,
    );
  } catch (error) {
    console.error("处理Excel文件时出错:", error);
  }
}

main();
