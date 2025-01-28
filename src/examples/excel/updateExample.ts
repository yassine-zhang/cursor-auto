import { updateExcelSheet } from "@/utils/excelWriter";
import { readExcelColumn } from "@/utils/excelReader";

async function main() {
  try {
    // 使用相对路径
    const filePath = "./data/output.xlsx";

    // 1. 覆盖模式：完全替换工作表数据
    const newUserData = [
      {
        name: "张三",
        email: "zhangsan@example.com",
        status: "active",
        joinDate: "2024-03-20",
      },
      {
        name: "李四",
        email: "lisi@example.com",
        status: "pending",
        joinDate: "2024-03-21",
      },
    ];

    updateExcelSheet(
      filePath,
      newUserData,
      "Users", // 使用与 writeExample 相同的工作表名
      ["name", "email", "status", "joinDate"],
      false, // 使用相对路径
      false, // 覆盖模式
    );

    // 2. 追加模式：向现有工作表添加数据
    const additionalData = [
      {
        name: "王五",
        email: "wangwu@example.com",
        status: "active",
        joinDate: "2024-03-22",
      },
      {
        name: "赵六",
        email: "zhaoliu@example.com",
        status: "active",
        joinDate: "2024-03-23",
      },
    ];

    updateExcelSheet(
      filePath,
      additionalData,
      "Users", // 使用同一个工作表
      ["name", "email", "status", "joinDate"],
      false, // 使用相对路径
      true, // 追加模式
    );

    // 3. 读取更新后的数据进行验证
    const updatedEmails = readExcelColumn(filePath, "email", "Users", false);
    console.log("\n更新后的用户邮箱列表:", updatedEmails);
    console.log(`总计用户数量: ${updatedEmails.length}`);
  } catch (error) {
    console.error("处理Excel文件时出错:", error);
  }
}

main();
