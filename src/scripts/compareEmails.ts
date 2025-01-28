import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { readExcelColumn } from "../utils/excelReader";
import * as readline from "readline";

interface TeamData {
  timestamp: string;
  totalMembers: number;
  members: {
    name: string;
    email: string;
    lastUsed: string;
    role: string;
  }[];
}

interface UserData {
  email: string;
  name: string;
  role: string;
  lastUsed: string;
  team?: string;
}

// 字段宽度配置
const WIDTHS = {
  index: 4, // 序号宽度（考虑中文"序号"两字）
  team: 8, // 团队名称宽度（考虑中文"团队"两字 + 团队编号）
  name: 16, // 用户名宽度（考虑中英文混合的名字）
  email: 35, // 邮箱宽度（纯英文，但要考虑较长的邮箱）
  role: 8, // 角色宽度（考虑 Member/Admin）
  lastUsed: 25, // 最后使用时间宽度（固定格式）
  emailList: 35, // 邮箱列表显示宽度
};

// 创建readline接口
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 询问用户是否要输出数据
async function askForOutput(question: string): Promise<boolean> {
  const rl = createInterface();
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} (y/n): `, resolve);
    });
    return answer.toLowerCase() === "y";
  } finally {
    rl.close();
  }
}

// 格式化字段，确保对齐（考虑中文宽度）
function formatField(content: string | number, width: number): string {
  const str = String(content || "");
  // 计算实际显示宽度（中文字符算2个宽度）
  const displayWidth = [...str].reduce((width, char) => {
    return width + (char.match(/[\u4e00-\u9fa5]/) ? 2 : 1);
  }, 0);

  if (displayWidth > width) {
    // 如果超出宽度，需要截断
    let currentWidth = 0;
    let result = "";
    for (const char of str) {
      const charWidth = char.match(/[\u4e00-\u9fa5]/) ? 2 : 1;
      if (currentWidth + charWidth > width) break;
      result += char;
      currentWidth += charWidth;
    }
    return result;
  }

  // 如果未超出宽度，补充空格
  return str + " ".repeat(width - displayWidth);
}

// 格式化用户数据输出
function formatUserData(user: UserData, index: number): string {
  const fields = [
    formatField(index + 1, WIDTHS.index),
    "[" + formatField(user.team || "未知", WIDTHS.team - 2) + "]",
    formatField(user.name || "", WIDTHS.name),
    formatField(user.email || "", WIDTHS.email),
    formatField(user.role || "", WIDTHS.role),
    user.lastUsed || "", // 最后使用时间不需要填充空格
  ];
  return fields.join(" | ");
}

// 生成表头
function generateHeader(): string {
  const fields = [
    formatField("序号", WIDTHS.index),
    formatField("团队", WIDTHS.team - 2),
    formatField("用户名", WIDTHS.name),
    formatField("邮箱", WIDTHS.email),
    formatField("角色", WIDTHS.role),
    formatField("最后使用时间", WIDTHS.lastUsed),
  ];
  return fields.join(" | ");
}

// 生成分隔线
function generateSeparator(): string {
  const totalWidth =
    WIDTHS.index +
    WIDTHS.team +
    WIDTHS.name +
    WIDTHS.email +
    WIDTHS.role +
    WIDTHS.lastUsed +
    15;
  return "=".repeat(totalWidth);
}

// 格式化邮箱列表输出
function formatEmailList(emails: string[]): void {
  const emailsPerRow = 3; // 每行显示的邮箱数量
  const separator = "=".repeat((WIDTHS.emailList + 3) * emailsPerRow + 5); // 分隔线长度

  console.log(separator);
  // 输出表头
  console.log(
    formatField("序号", 4) +
      " | " +
      formatField("邮箱", WIDTHS.emailList) +
      " | " +
      formatField("序号", 4) +
      " | " +
      formatField("邮箱", WIDTHS.emailList) +
      " | " +
      formatField("序号", 4) +
      " | " +
      formatField("邮箱", WIDTHS.emailList),
  );
  console.log(separator);

  // 按每行三个邮箱进行分组输出
  for (let i = 0; i < emails.length; i += emailsPerRow) {
    const row = [];
    for (let j = 0; j < emailsPerRow; j++) {
      if (i + j < emails.length) {
        row.push(
          formatField(i + j + 1, 4) +
            " | " +
            formatField(emails[i + j], WIDTHS.emailList),
        );
      } else {
        row.push(
          formatField("", 4) + " | " + formatField("", WIDTHS.emailList),
        );
      }
    }
    console.log(row.join(" | "));
  }
  console.log(separator);
}

async function readJsonFiles(directory: string): Promise<UserData[]> {
  const users: UserData[] = [];
  try {
    const files = await readdir(directory);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await readFile(join(directory, file), "utf-8");
        const data = JSON.parse(content) as TeamData[];

        // 从文件名中提取团队名称
        const teamName = file.replace("-data.json", "").replace("team-", "");

        // 处理每个团队文件
        data.forEach((team) => {
          team.members.forEach((member) => {
            users.push({
              email: member.email || "",
              name: member.name === "No name available" ? "未知" : member.name,
              role: member.role || "",
              lastUsed: member.lastUsed || "",
              team: teamName,
            });
          });
        });
      }
    }
    return users;
  } catch (error) {
    console.error("读取JSON文件失败:", error);
    throw error;
  }
}

async function writeToFile(filename: string, content: string) {
  try {
    await writeFile(filename, content, "utf-8");
    console.log(`结果已写入到文件: ${filename}`);
  } catch (error) {
    console.error(`写入文件失败: ${filename}`, error);
  }
}

async function main() {
  try {
    // 读取所有JSON文件中的用户数据
    const jsonUsers = await readJsonFiles("./data");
    console.log(`从JSON文件中读取到 ${jsonUsers.length} 个用户数据`);

    // 读取Excel文件中的邮箱列
    const excelPath =
      "/Users/mac/Desktop/Projects/Profile数据资源/Cursor相关/Cursor Team Users.xlsx";

    // 从self-invited-users工作表读取A列数据
    const selfInvitedEmails = readExcelColumn(
      excelPath,
      "A",
      "self-invited-users",
      true,
    ).slice(1);
    console.log(
      `\nself-invited-users表中共有 ${selfInvitedEmails.length} 个邮箱`,
    );

    // 从partner-invited工作表读取A列数据
    const partnerInvitedEmails = readExcelColumn(
      excelPath,
      "A",
      "partner-invited",
      true,
    ).slice(1);
    console.log(
      `\npartner-invited表中共有 ${partnerInvitedEmails.length} 个邮箱`,
    );

    // 询问是否输出详细信息
    const shouldShowDetails = await askForOutput(
      "是否显示详细信息（包括JSON数据、邮箱列表和重复邮箱）？",
    );

    if (shouldShowDetails) {
      // 输出JSON数据
      console.log("\nJSON文件中的用户数据:");
      const separator = generateSeparator();
      console.log(separator);
      console.log(generateHeader());
      console.log(separator);
      jsonUsers.forEach((user, index) => {
        console.log(formatUserData(user, index));
      });
      console.log(separator);

      // 输出self-invited-users邮箱列表
      console.log("\nself-invited-users表中的邮箱:");
      formatEmailList(selfInvitedEmails);

      // 输出partner-invited邮箱列表
      console.log("\npartner-invited表中的邮箱:");
      formatEmailList(partnerInvitedEmails);
    }

    // 整合所有邮箱数据
    const allEmails = [...selfInvitedEmails, ...partnerInvitedEmails];
    console.log(`\n总共收集到 ${allEmails.length} 个邮箱`);

    // 查找重复的邮箱
    const emailCount = new Map<string, number>();
    const duplicateEmails = new Set<string>();

    // 统计每个邮箱出现的次数
    allEmails.forEach((email) => {
      const lowerEmail = email.toLowerCase();
      emailCount.set(lowerEmail, (emailCount.get(lowerEmail) || 0) + 1);
      if (emailCount.get(lowerEmail)! > 1) {
        duplicateEmails.add(email);
      }
    });

    // 输出重复邮箱信息
    if (duplicateEmails.size > 0) {
      console.log("\n在所有表中重复出现的邮箱:");
      const separator = generateSeparator();
      console.log(separator);
      // 输出表头（不包含序号列）
      const fields = [
        "[" + formatField("团队", WIDTHS.team - 2) + "]",
        formatField("用户名", WIDTHS.name),
        formatField("邮箱", WIDTHS.email),
        formatField("角色", WIDTHS.role),
        formatField("最后使用时间", WIDTHS.lastUsed),
        formatField("重复次数", 10),
      ];
      console.log(fields.join(" | "));
      console.log(separator);

      // 按重复次数降序排序
      const sortedDuplicates = Array.from(duplicateEmails).sort((a, b) => {
        return (
          (emailCount.get(b.toLowerCase()) || 0) -
          (emailCount.get(a.toLowerCase()) || 0)
        );
      });

      sortedDuplicates.forEach((email) => {
        const user = jsonUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        const count = emailCount.get(email.toLowerCase()) || 0;
        if (user) {
          const fields = [
            "[" + formatField(user.team || "未知", WIDTHS.team - 2) + "]",
            formatField(user.name || "", WIDTHS.name),
            formatField(email, WIDTHS.email),
            formatField(user.role || "", WIDTHS.role),
            formatField(user.lastUsed || "", WIDTHS.lastUsed),
            formatField(count.toString(), 10),
          ];
          console.log(fields.join(" | "));
        } else {
          const fields = [
            "[" + formatField("未知", WIDTHS.team - 2) + "]",
            formatField("未知", WIDTHS.name),
            formatField(email, WIDTHS.email),
            formatField("未知", WIDTHS.role),
            formatField("未知", WIDTHS.lastUsed),
            formatField(count.toString(), 10),
          ];
          console.log(fields.join(" | "));
        }
      });
      console.log(separator);
      console.log(`\n总计发现 ${duplicateEmails.size} 个重复邮箱`);
    } else {
      console.log("\n未发现重复邮箱");
    }

    // 检查未在JSON中找到的邮箱
    const notFoundInJson = allEmails.filter(
      (email) =>
        !jsonUsers.some(
          (user) => user.email.toLowerCase() === email.toLowerCase(),
        ),
    );

    if (notFoundInJson.length > 0) {
      console.log("\n以下邮箱在JSON数据中未找到:");
      const separator = "=".repeat(WIDTHS.email + 20);
      console.log(separator);
      console.log(
        formatField("序号", 4) +
          " | " +
          formatField("邮箱", WIDTHS.email) +
          " | " +
          "来源",
      );
      console.log(separator);

      // 准备写入文件的内容
      let fileContent = "在JSON数据中未找到的邮箱:\n";
      fileContent += "=".repeat(80) + "\n";
      fileContent += "序号 | 邮箱 | 来源\n";
      fileContent += "=".repeat(80) + "\n";

      notFoundInJson.forEach((email, index) => {
        const source = [];
        if (selfInvitedEmails.includes(email)) source.push("self-invited");
        if (partnerInvitedEmails.includes(email))
          source.push("partner-invited");

        const line = `${index + 1}. ${email} | ${source.join(", ")}`;
        console.log(
          formatField(index + 1, 4) +
            " | " +
            formatField(email, WIDTHS.email) +
            " | " +
            source.join(", "),
        );
        fileContent += line + "\n";
      });

      fileContent += "=".repeat(80) + "\n\n";
      fileContent += "邮箱列表（逗号分隔）:\n";
      fileContent += notFoundInJson.join(",");

      await writeToFile("not_found_in_json.txt", fileContent);
      console.log(separator);
      console.log(`\n总计有 ${notFoundInJson.length} 个邮箱在JSON数据中未找到`);
    } else {
      console.log("\n所有邮箱都在JSON数据中找到了对应记录");
    }

    // 检查JSON中独有的邮箱（不在Excel表中的邮箱）
    const jsonOnlyEmails = jsonUsers.filter(
      (user) =>
        !allEmails.some(
          (email) => email.toLowerCase() === user.email.toLowerCase(),
        ),
    );

    if (jsonOnlyEmails.length > 0) {
      console.log("\nJSON数据中独有的邮箱（不在Excel表中）:");
      const separator = generateSeparator();
      console.log(separator);

      // 准备写入文件的内容
      let fileContent = "JSON数据中独有的邮箱（不在Excel表中）:\n";
      fileContent += "=".repeat(120) + "\n";
      fileContent += "序号 | 团队 | 用户名 | 邮箱 | 角色 | 最后使用时间\n";
      fileContent += "=".repeat(120) + "\n";

      // 按团队和邮箱排序
      const sortedJsonOnly = jsonOnlyEmails.sort((a, b) => {
        const teamCompare = (a.team || "").localeCompare(b.team || "");
        if (teamCompare !== 0) return teamCompare;
        return a.email.localeCompare(b.email);
      });

      // 输出到控制台和准备文件内容
      const fields = [
        "[" + formatField("团队", WIDTHS.team - 2) + "]",
        formatField("用户名", WIDTHS.name),
        formatField("邮箱", WIDTHS.email),
        formatField("角色", WIDTHS.role),
        formatField("最后使用时间", WIDTHS.lastUsed),
      ];
      console.log(fields.join(" | "));
      console.log(separator);

      sortedJsonOnly.forEach((user, index) => {
        const fields = [
          "[" + formatField(user.team || "未知", WIDTHS.team - 2) + "]",
          formatField(user.name || "", WIDTHS.name),
          formatField(user.email, WIDTHS.email),
          formatField(user.role || "", WIDTHS.role),
          formatField(user.lastUsed || "", WIDTHS.lastUsed),
        ];
        console.log(fields.join(" | "));

        // 添加到文件内容
        fileContent += `${index + 1}. [${user.team || "未知"}] | ${user.name || ""} | ${user.email} | ${user.role || ""} | ${user.lastUsed || ""}\n`;
      });

      fileContent += "=".repeat(120) + "\n\n";
      fileContent += "邮箱列表（逗号分隔）:\n";
      fileContent += sortedJsonOnly.map((user) => user.email).join(",");

      await writeToFile("json_only_emails.txt", fileContent);
      console.log(separator);
      console.log(`\n总计有 ${jsonOnlyEmails.length} 个邮箱仅在JSON数据中存在`);
    } else {
      console.log("\nJSON数据中没有独有的邮箱，所有邮箱都在Excel表中存在");
    }
  } catch (error) {
    console.error("程序执行失败:", error);
  }
}

main();
