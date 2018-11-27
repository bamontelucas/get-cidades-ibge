const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://cidades.ibge.gov.br/');

    const all_href = await page.evaluate(async () => {

        const wait1sec = () => new Promise((resolve, reject) => {
            setTimeout(resolve, 1000)
        });

        document.querySelector('#localidade > button:nth-child(2)').click();
        document.querySelector('#menu__municipio').click();

        await wait1sec();

        var all_href = [];
        document.querySelectorAll('#segunda-coluna > ul > li').forEach(li => {
            li.click();
            let href = [...document.querySelectorAll('#municipios a')].map(a => a.href);
            all_href = all_href.concat(href);
        });

        all_href = [...(new Set(all_href))];

        return all_href;
    });

    let data = [];

    for(let i=0; i<50 /*all_href.length*/; i++) {
        try {
            await page.goto(all_href[i] + '/panorama');
            let city = await page.evaluate(async () => {
                const wait1000ms = () => new Promise((resolve, reject) => {
                    setTimeout(resolve, 1000)
                });
                await wait1000ms();
                const nome = document.querySelector('#local > ul > li:nth-child(3) > h1').textContent.trim();
                let codigo = document.querySelector('#dados .topo > .topo__celula-esquerda > .topo__valor');
                let waits = 0;
                while(codigo === null) {
                    if(waits === 15) {
                        throw 'Esperei demais';
                    }
                    waits++;
                    await wait1000ms();
                    codigo = document.querySelector('#dados .topo > .topo__celula-esquerda > .topo__valor');
                }
                codigo = codigo.textContent.trim();
        
                return {nome, codigo};
            });
            city.uf = all_href[i].replace(new RegExp('^https?:\/\/cidades\.ibge\.gov\.br\/brasil\/([a-z]{2})\/[^/]+\/?$'), '$1');
            data.push(city);
        } catch (ex) {
            console.error(`Erro url ${all_href[i]}`);
            console.log(ex);
        }
        
    }
    console.log(data);

    await browser.close();
})();