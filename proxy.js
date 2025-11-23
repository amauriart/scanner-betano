\
    import express from "express";
    import puppeteer from "puppeteer";
    const router = express.Router();

    // returns array of { start_time, competition, country, home, away, market, odd, source_url }
    router.get("/", async (req, res) => {
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

        // navigate to Betano football page
        const url = "https://www.betano.com/sport/futebol/";
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForTimeout(3000);

        const items = await page.evaluate(() => {
          const out = [];
          // Heuristic: find event blocks that contain ' x ' (home x away) and lines with Over markets
          const blocks = Array.from(document.querySelectorAll("div")).filter(n => n.innerText && /\b\d{1,2}:\d{2}\b|\b\d{1,2}h\b|\s[x×]\s/.test(n.innerText));
          const seen = new Set();

          for (const node of blocks) {
            try {
              const text = node.innerText;
              const match = text.match(/(.{1,60})\s[x×]\s(.{1,60})/);
              if (!match) continue;
              const home = match[1].split("\n").pop().trim();
              const away = match[2].split("\n")[0].trim();
              const key = home + "||" + away;
              if (seen.has(key)) continue;
              seen.add(key);

              // try to find competition by walking up
              let competition = "Desconhecido";
              let ancestor = node;
              for (let i=0;i<6 && ancestor;i++){
                const h2 = ancestor.querySelector && (ancestor.querySelector("h2") || ancestor.querySelector("h3"));
                if (h2 && h2.innerText) { competition = h2.innerText.trim(); break; }
                ancestor = ancestor.parentElement;
              }

              // try to find start time (if present)
              const timeEl = node.querySelector && node.querySelector("time");
              const start_time = timeEl ? (timeEl.getAttribute("datetime") || timeEl.innerText) : null;

              // gather lines to find markets
              const lines = text.split(/\n/).map(s=>s.trim()).filter(Boolean);
              let over05 = null, over15 = null;
              for (const L of lines){
                if (/Mais de 0.5|Over 0.5/i.test(L)){
                  const n = L.match(/\d+[,.]?\d*/);
                  if(n) over05 = parseFloat(n[0].replace(',','.'));
                }
                if (/Mais de 1.5|Over 1.5/i.test(L)){
                  const n = L.match(/\d+[,.]?\d*/);
                  if(n) over15 = parseFloat(n[0].replace(',','.'));
                }
              }

              if (over05 !== null) out.push({ start_time: start_time || null, competition, country: "—", home, away, market: "Over 0.5", odd: over05, source_url: window.location.href });
              if (over15 !== null) out.push({ start_time: start_time || null, competition, country: "—", home, away, market: "Over 1.5", odd: over15, source_url: window.location.href });

            } catch(e){}
          }
          return out;
        });

        await browser.close();

        res.json(items);
      } catch (err) {
        console.error("Scrape error:", err);
        res.status(500).json({ error: "Scrape failed", details: String(err) });
      }
    });

    export default router;
