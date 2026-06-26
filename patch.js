const fs = require('fs');
const imgPath = 'C:/Users/user/.gemini/antigravity-ide/brain/88d2514e-fc5a-482c-b766-6955860a1904/media__1782388767055.png';

try {
    const imgData = fs.readFileSync(imgPath);
    const base64Img = 'data:image/png;base64,' + imgData.toString('base64');
    
    let html = fs.readFileSync('teacher.html', 'utf-8');
    
    // Replace SVG with the image
    const svgRegex = /<svg class="fingerprint-svg"[^>]*>[\s\S]*?<\/svg>/;
    html = html.replace(svgRegex, `<img class="fingerprint-svg" src="${base64Img}" style="width:150px; height:200px; object-fit:contain; filter: brightness(0) saturate(100%) invert(39%) sepia(85%) saturate(1450%) hue-rotate(87deg) brightness(115%) contrast(110%); mix-blend-mode: screen; opacity: 0.8; transition: filter 0.3s;" />`);
    
    // Also fix updateRouletteUI
    const oldUpdate = `function updateRouletteUI() {
            if(!currentGroup) return;
            const state = rouletteState[currentGroup];
            updateDots();

            if (state.clickCount === 0) {
                document.getElementById('roulette-result').innerHTML = 'READY FOR SCANNING...';
            }
        }`;
        
    const newUpdate = `function updateRouletteUI() {
            if(!currentGroup) return;
            const state = rouletteState[currentGroup];
            updateDots();

            const resDisplay = document.getElementById('roulette-result');
            if (state.clickCount === 0) {
                resDisplay.innerHTML = 'READY FOR SCANNING...';
            } else {
                const lastClickIndex = state.clickCount - 1;
                if (lastClickIndex === state.mafiaIndex) {
                    resDisplay.innerHTML = '🚨 <span class="result-mafia">TARGET IDENTIFIED: MAFIA</span> 🚨';
                } else {
                    resDisplay.innerHTML = '<span class="result-citizen">CLEAR: CITIZEN</span>';
                }
            }
        }`;
        
    html = html.replace(oldUpdate, newUpdate);
    
    // Fix the select text overriding bug
    const bugLine = "document.getElementById('roulette-group').options[document.getElementById('roulette-group').selectedIndex].text = currentGroup;";
    html = html.replace(bugLine, '');
    
    fs.writeFileSync('teacher.html', html, 'utf-8');
    console.log('Successfully updated teacher.html with base64 image and fixed bugs.');
} catch (e) {
    console.error(e);
}
