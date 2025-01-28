import puppeteer, { Page } from "puppeteer";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { createInterface } from "readline";

interface MemberData {
  name: string;
  email: string;
  lastUsed: string;
  role: string;
}

interface TeamData {
  team: string;
  timestamp: string;
  totalMembers: number;
  members: MemberData[];
}

interface MonitorConfig {
  url: string;
  outputPath: string;
  interval: number;
  continuous: boolean;
  team: string;
}

// 创建命令行交互接口
function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

// 确保数据目录存在
async function ensureDataDir(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// 获取北京时间的 ISO 字符串
function getChinaTime() {
  const date = new Date();
  // 获取当前时间的时间戳
  const timestamp = date.getTime();
  // 加上8小时的毫秒数
  const chinaTimestamp = timestamp + 8 * 60 * 60 * 1000;
  // 创建新的日期对象
  const chinaDate = new Date(chinaTimestamp);
  return chinaDate.toISOString();
}

async function saveData(outputPath: string, data: TeamData) {
  try {
    let existingData: TeamData[] = [];

    // 如果文件存在，读取现有数据
    if (existsSync(outputPath)) {
      const fileContent = await readFile(outputPath, "utf-8");
      try {
        existingData = JSON.parse(fileContent);
      } catch (e) {
        // 如果解析失败，使用空数组
        existingData = [];
      }
    }

    // 添加新数据
    existingData.push(data);

    // 写入完整的数据数组
    await writeFile(outputPath, JSON.stringify(existingData, null, 2), {
      flag: "w",
    });
  } catch (error) {
    console.error("保存数据失败:", error);
  }
}

async function monitorBrowserPage(config: MonitorConfig) {
  try {
    const browser = await puppeteer.connect({
      browserURL: "http://localhost:9222",
      defaultViewport: null,
    });

    console.log("已连接到浏览器");

    const pages = await browser.pages();
    const targetPage = pages.find((page) => page.url().includes(config.url));

    if (!targetPage) {
      console.error("未找到目标页面，请确保浏览器中已打开要监控的页面");
      await browser.disconnect();
      process.exit(1);
    }

    // 现在 TypeScript 知道 targetPage 一定存在
    console.log("已找到目标页面:", targetPage.url());

    // 定义获取数据的函数
    async function getData(targetPage: Page, team: string) {
      try {
        const members = await targetPage.evaluate(() => {
          const memberElements = document.querySelectorAll(
            ".flex.w-full.cursor-pointer",
          );
          return Array.from(memberElements).map((element) => {
            const nameElement = element.querySelector(
              '[class*="w-[150px]"] [class*="truncate"]',
            );
            const emailElement = element.querySelector(
              '[class*="w-[240px]"] span',
            );
            const lastUsedElement = element.querySelector(
              '[class*="w-[200px]"]',
            );
            const roleElement = element.querySelector(
              '[class*="text-brand-gray-600"]',
            );

            return {
              name:
                nameElement?.getAttribute("title") ||
                nameElement?.textContent?.trim() ||
                "No name",
              email: emailElement?.textContent?.trim() || "",
              lastUsed: lastUsedElement?.getAttribute("title") || "-",
              role: roleElement?.textContent?.trim() || "Unknown",
            };
          });
        });

        const output: TeamData = {
          team,
          timestamp: getChinaTime(),
          totalMembers: members.length,
          members: members,
        };

        await saveData(config.outputPath, output);

        const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
        console.log(
          `数据已保存: ${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}, 团队: ${team}, 共 ${members.length} 个成员`,
        );

        return members.length;
      } catch (error) {
        console.error("获取数据失败:", error);
        return -1;
      }
    }

    if (config.continuous) {
      // 持续监控模式
      console.log(
        `开始持续监控，每 ${config.interval / 1000} 秒获取一次数据...`,
      );

      // 监听 Ctrl+C
      process.on("SIGINT", async () => {
        console.log("\n正在断开浏览器连接...");
        await browser.disconnect();
        process.exit(0);
      });

      // 开始定时获取数据
      while (true) {
        await getData(targetPage, config.team);
        await new Promise((resolve) => setTimeout(resolve, config.interval));
      }
    } else {
      // 单次获取模式
      await getData(targetPage, config.team);
      console.log("正在断开浏览器连接...");
      await browser.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error("连接浏览器失败:", error);
    process.exit(1);
  }
}

async function startMonitor() {
  try {
    const dataDir = join(process.cwd(), "data");
    await ensureDataDir(dataDir);

    // 获取团队名称
    const team = await askQuestion("请输入团队名称: ");
    if (!team.trim()) {
      console.log("团队名称不能为空");
      process.exit(1);
    }

    let fileName = await askQuestion(
      `请输入要保存的文件名 (默认: team-${team}-data.json): `,
    );
    if (!fileName.trim()) {
      fileName = `team-${team}-data.json`;
    }
    if (!fileName.endsWith(".json")) {
      fileName += ".json";
    }

    // 询问监控模式
    const mode = await askQuestion(
      "选择运行模式 (1: 单次获取, 2: 持续监控) [1]: ",
    );
    const continuous = mode === "2";

    // 获取监控间隔
    let intervalMs = 5000; // 默认5秒
    if (continuous) {
      const interval = await askQuestion("请输入监控间隔（秒）[5]: ");
      intervalMs = (parseInt(interval) || 5) * 1000;
      console.log(`将每 ${intervalMs / 1000} 秒获取一次数据`);
    }

    const config: MonitorConfig = {
      url: "https://www.cursor.com/settings",
      interval: intervalMs,
      outputPath: join(dataDir, fileName),
      continuous,
      team,
    };

    console.log(`数据将保存到: ${config.outputPath}`);
    console.log(`监控团队: ${team}`);

    const confirm = await askQuestion("是否开始执行? (y/n): ");
    if (confirm.toLowerCase() !== "y") {
      console.log("已取消执行");
      process.exit(0);
    }

    await monitorBrowserPage(config);
  } catch (error) {
    console.error("启动失败:", error);
    process.exit(1);
  }
}

// 启动程序
startMonitor();
