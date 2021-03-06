const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.goto('http://books.toscrape.com')
        await page.waitForSelector('.page_inner');

        let urls = await page.$$eval('section ol > li', links =>{
            links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
            links = links.map(el => el.querySelector('h3 > a').href)
            return links;
        });
        

        let pagePromise = link => new Promise(async (resolve, reject) =>{
            let dataObj = {};
            let newPage = await browser.newPage();
            await newPage.goto(link);
            dataObj['booktitle'] = await newPage.$eval('.product_main > h1', text => text.textContent);
            dataObj['bookPrice'] = await newPage.$eval('.price_color', text => text.textContent);
            dataObj['noAvailable'] = await newPage.$eval('.instock.availability', text => {
                text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");

                let regexp = /^.*\((.*)\).*$/i;
                let stockAvailable = regexp.exec(text)[1].split(' ')[0];
                return stockAvailable;
            });

            dataObj['imageUrl'] = await newPage.$eval('#product_gallery img', img => img.src);
            dataObj['bookDescription'] = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
            dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);

            resolve(dataObj);
            await newPage.close();
        })

        for (link in urls){
            let currentPageData = await pagePromise(urls[link]);
            console.log(currentPageData);
        }

        await browser.close();
    } catch (error) {
        throw error;
    }
    
})().catch(e =>console.error(e.stack));