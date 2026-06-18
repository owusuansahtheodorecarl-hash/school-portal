const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

function parseCSVLine(text) {
    const result = [];
    let insideQuote = false;
    let entry = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"' || char === "'") {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(entry.trim());
            entry = "";
        } else {
            entry += char;
        }
    }
    result.push(entry.trim());
    return result;
}

app.post('/login', (req, res) => {
    const { studentID, password } = req.body;
    const inputID = studentID.toString().trim();
    const inputPass = password.toString().trim();

    const fileContent = fs.readFileSync(path.join(__dirname, 'data.csv'), 'utf8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return res.json({ success: false, message: "Database is empty." });

    // Read headers and clean them up
    const headers = parseCSVLine(lines[0]).map(h => h.toUpperCase().trim());
    
    // Dynamic scanner: find columns based on keywords, no matter where Excel put them
    const findIndex = (kw) => headers.findIndex(h => h.includes(kw));

    const idxID = findIndex("ID") !== -1 ? findIndex("ID") : 0;
    const idxPass = findIndex("PASSWORD") !== -1 ? findIndex("PASSWORD") : 1;
    const idxName = findIndex("NAME") !== -1 ? findIndex("NAME") : 2;
    const idxEnglish = findIndex("ENGLISH");
    const idxMaths = findIndex("MATH");
    const idxScience = findIndex("SCIENCE");
    const idxSocial = findIndex("SOCIAL") !== -1 ? findIndex("SOCIAL") : findIndex("STUDIES");
    const idxRme = findIndex("RME");
    const idxComp = findIndex("COMPUT");
    const idxArts = findIndex("CREATIVE") !== -1 ? findIndex("CREATIVE") : findIndex("ARTS");
    
    // ULTIMATE CAREER TECH SCANNER: looks for CAREER or TECH, but ignores CLASS RANKING
    let idxTech = headers.findIndex(h => h.includes("CAREER") || (h.includes("TECH") && !h.includes("RANK")));
    if (idxTech === -1) idxTech = 10; // safety fallback

    const idxFante = findIndex("FANTE");
    const idxFrench = findIndex("FRENCH");
    const idxRaw = findIndex("RAW");
    const idxRank = findIndex("RANK");

    for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);

        if (columns[idxID] === inputID && columns[idxPass] === inputPass) {
            return res.json({
                success: true,
                name: columns[idxName] || "N/A",
                english: columns[idxEnglish] !== -1 ? columns[idxEnglish] : "0",
                maths: columns[idxMaths] !== -1 ? columns[idxMaths] : "0",
                science: columns[idxScience] !== -1 ? columns[idxScience] : "0",
                socialStudies: idxSocial !== -1 ? columns[idxSocial] : "0", 
                rme: columns[idxRme] !== -1 ? columns[idxRme] : "0",
                computing: columns[idxComp] !== -1 ? columns[idxComp] : "0",
                creativeArts: columns[idxArts] !== -1 ? columns[idxArts] : "0",
                careerTech: columns[idxTech] || "0", // Grabbed by the smart scanner
                fante: columns[idxFante] !== -1 ? columns[idxFante] : "0",
                french: columns[idxFrench] !== -1 ? columns[idxFrench] : "0",
                rawScore: columns[idxRaw] !== -1 ? columns[idxRaw] : "0",
                classRanking: columns[idxRank] !== -1 ? columns[idxRank] : "N/A"
            });
        }
    }
    res.json({ success: false, message: "Invalid ID or Password." });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running locally! http://localhost:3000`);
});