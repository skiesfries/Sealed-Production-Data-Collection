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
        await page.goto(`https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&page=${pageNumber}&view=grid&ProductTypeName=Sealed+Products&inStock=true`,
        { waitUntil: 'networkidle0' }
        );

        try {
            await page.waitForSelector('.search-result');
          } catch (error) {
            console.log('The .search-result selector is not available, stopping script');
            break;
          }
          // Get the search result products
        const productElements = await page.$$('.search-result');

        // Iterate over the search result products
        for (const productElement of productElements) 
        {
            
            const productData = await page.evaluate((productElement) => {
                const src = productElement.querySelector('img[src]').getAttribute('src');
                const name = productElement.querySelector('.search-result__title').innerText;
                const setName = productElement.querySelector('.search-result__subtitle').innerText;
                const price = productElement.querySelector('.inventory__price-with-shipping').innerText;
                return {src,name,setName,price};
            }, productElement);
            
            const baseURL = 'https://www.tcgplayer.com';
            const productURL = await productElement.$eval('a', a => a.getAttribute('href'));
            const fullURL = baseURL+productURL;
            

            const productPage = await browser.newPage();
            await productPage.goto(fullURL);
            
            try {
              await productPage.waitForSelector('ul.product__item-details__attributes li span');
            } catch (error) {
              console.log('No product description, going to next product...');
            }

            const descriptionElement = await productPage.$('ul.product__item-details__attributes li span');
            let description = '';
            
            if (descriptionElement) 
            {
            description = await productPage.evaluate(element => element.innerText, descriptionElement);
            }

            await productPage.close();

            data.push({productData,description});
        }
        pageNumber++;
    }
    
    fs.appendFile('products.txt', JSON.stringify(data) + '\n', (err) => {
        if (err) throw err;
        console.log('The file has been saved');
      });
      
    await browser.close();
})();