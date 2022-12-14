const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
const FormData = require("form-data");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

dotenv.config();
const SERVER_ID = "446997274132873220";
const { WEBHOOK_URL, MEE6_TOKEN } = process.env;

const months = {
    "0": "Januar",
    "1": "Februar",
    "2": "März",
    "3": "April",
    "4": "Mai",
    "5": "Juni",
    "6": "Juli",
    "7": "August",
    "8": "September",
    "9": "Oktober",
    "10": "November",
    "11": "Dezember"
};

const today = new Date();
const yearMonth = () => {
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
        height: 1569
    }
}).then(async (browser) => {
    const page = await browser.newPage();
    const [year, month] = yearMonth();
    if (!fs.existsSync(`${year}`)) fs.mkdirSync(`${year}`);
    await page.goto(`https://mee6.xyz/leaderboard/${SERVER_ID}`);
    await page.waitForXPath("/html/body/div[1]/div[2]/div[3]/div[1]/div"); /* Leaderboard Element */
    await page.screenshot({ path: path.join(`${year}`, `${month}.png`) });
    await browser.close();
    console.log("Screenshot created")
    const form = new FormData();
    form.append("file", fs.readFileSync(path.join(`${year}`, `${month}.png`)), `${month}.png`);
    form.append("payload_json", JSON.stringify({
        embeds: [{
            title: `Leaderboard für ${month} ${year}`,
            color: 38655, /* #0096ff */
            image: {
                url: `attachment://${month}.png`
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