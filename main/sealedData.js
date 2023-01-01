const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => 
{
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    let pageNumber = 1;
    let data = [];

    while (true) 
    {
        await page.goto('https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&page=1=${pageNumber}&view=grid&ProductTypeName=Sealed+Products&inStock=true');

        await page.waitForSelector('.search-result');

        const pageData = await page.evaluate(() => 
        {
            const products = [];
            
            const productElements = document.querySelectorAll('.search-result');

            for(const productElement of productElements)
            {
                const image = productElement.querySelector('.lazy-image__wrapper').src;
                const name = productElement.querySelector('.search-result__title').innerText;
                const setName = productElement.querySelector('.search-result__subtitle').innerText;
                const price = productElement.querySelector('.inventory__price-with-shipping').innerText;
    
                products.push({image, name, setName, price});
            }
            
            return products;
        });
        
        data = data.concat(pageData);

        if(!pageData.length)
        {
            break;
        }

        pageNumber++;
    }

    fs.writeFile('products.txt', JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log('The file has been saved');
    });
    await browser.close();
})();