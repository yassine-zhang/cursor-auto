import { readExcelColumn } from "@/utils/excelReader";

async function main() {
  try {
    const absolutePath =
      "/Users/mac/Desktop/Projects/Profile数据资源/Cursor相关/Cursor Team Users.xlsx";

    // 读取 self-invited-users sheet 的邮箱数据
    const selfInvitedEmails = readExcelColumn(
      absolutePath,
      "A",
      "self-invited-users",
      true,
    ).slice(1);
    console.log("\n自主邀请的团队成员邮箱列表:", selfInvitedEmails);
    console.log(`自主邀请邮箱总数: ${selfInvitedEmails.length}`);

    // 读取 partner-invited sheet 的邮箱数据
    const partnerInvitedEmails = readExcelColumn(
      absolutePath,
      "A",
      "partner-invited",
      true,
    ).slice(1);
    console.log("\n合伙人邀请的团队成员邮箱列表:", partnerInvitedEmails);
    console.log(`合伙人邀请邮箱总数: ${partnerInvitedEmails.length}`);

    // 输出总计数据
    const totalEmails = selfInvitedEmails.length + partnerInvitedEmails.length;
    console.log(`\n总邮箱数量: ${totalEmails}`);
  } catch (error) {
    console.error("读取邮箱数据时出错:", error);
  }
}

main();
