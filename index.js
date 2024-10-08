const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
const FormData = require("form-data");

dotenv.config();
const SERVER_ID = "446997274132873220";
const { WEBHOOK_URL, MEE6_TOKEN } = process.env;

const months = [
    "1 Januar",
    "2 Februar",
    "3 März",
    "4 April",
    "5 Mai",
    "6 Juni",
    "7 Juli",
    "8 August",
    "9 September",
    "10 Oktober",
    "11 November",
    "12 Dezember"
];

const today = new Date();
const getMonthAndYear = () => {
    let month = today.getMonth() - 1;
    let year = today.getFullYear();
    if (month == -1) {
        month = 11;
        year = year - 1;
    }
    return [year, months[month]];
};

puppeteer.launch({
    defaultViewport: {
        width: 960,
        height: 1095
    }
}).then(async (browser) => {
    const page = await browser.newPage();

    const [year, month] = getMonthAndYear();
    if (!fs.existsSync(`${year}`)) fs.mkdirSync(`${year}`);

    await page.goto(`https://mee6.xyz/leaderboard/${SERVER_ID}`);

    await page.waitForSelector("xpath///*[@id='root']/div[3]/div/div[1]"); /* Leaderboard Element */
    await page.waitForNetworkIdle();

    const filters = [
        "xpath///*[@id='root']/div[2]/div/div[2]", // Navbar Buttons
        "xpath///*[@id='root']/div[3]/div/div[1]/div[3]/button", // Join Button
        "xpath///*[contains(@id, 'howItWorks')]", // How it works
        "xpath///*[contains(@class, 'cky')]", // Cookie Notice
        "xpath///*[contains(@id, 'ad')]", // Ads
        "xpath///*[contains(@class, 'bg-gradient-ai')]", // AI Ad
    ]
    for (const f of filters) {
        const elements = await page.$$(f);
        for (const element of elements)
            await page.evaluate((element) => element.remove(), element);
    }

    await page.screenshot({ path: path.join(`${year}`, `${month}.png`) });
    await browser.close();
    console.log("Screenshot created")

    const form = new FormData();
    const attachmentName = `${month.split(" ")[1].replace("ä", "ae")}.png`
    form.append("file", fs.readFileSync(path.join(`${year}`, `${month}.png`)), attachmentName);
    form.append("payload_json", JSON.stringify({
        embeds: [{
            title: `Leaderboard für ${month.split(" ")[1]} ${year}`,
            color: 38655, /* #0096ff */
            image: {
                url: `attachment://${attachmentName}`
            }
        }]
    }));
    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: form.getHeaders(),
        body: form
    });
    console.log("Webhook sent")
}).finally(async () => {
    if (!today.getMonth() == 0) return;
    const resp = await fetch(`https://mee6.xyz/api/plugins/levels/do-reset/${SERVER_ID}`, {
        method: "POST",
        headers: { "Authorization": MEE6_TOKEN }
    });
    if (resp.ok) console.log("Leaderboard resetted");
    else throw new Error(resp.statusText);
});