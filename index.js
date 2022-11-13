const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const dotenv = require("dotenv");

const SERVER_ID = "446997274132873220";

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

puppeteer.launch({
    defaultViewport: {
        width: 960,
        height: 1530
    }
}).then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(`https://mee6.xyz/leaderboard/${SERVER_ID}`);
    if (!fs.existsSync(`${today.getFullYear()}`)) fs.mkdirSync(`${today.getFullYear()}`);
    new Promise(resolve => setTimeout(resolve, 5000)); /* Wait for the page to be loaded */
    await page.screenshot({ path: path.join(`${today.getFullYear()}`, `${months[today.getMonth()]}.png`) });
    await browser.close();
    console.log("Screenshot created")
}).finally(async () => {
    if (!today.getMonth() == 0) return;
    dotenv.config();
    const resp = await fetch(`https://mee6.xyz/api/plugins/levels/do-reset/${SERVER_ID}`, {
        method: "POST",
        headers: { "Authorization": process.env.MEE6_TOKEN }
    });
    if (resp.ok) console.log("Dashboard resetted");
    else throw new Error(resp.statusText);
});