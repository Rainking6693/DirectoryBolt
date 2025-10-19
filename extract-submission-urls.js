const fs = require('fs');

// Read the complete directory database
const data = JSON.parse(fs.readFileSync('directories/complete-directory-database.json', 'utf8'));

// Function to check if a directory is a news site that doesn't accept business submissions
function isNewsSiteWithoutBusinessSubmissions(directory) {
    const newsKeywords = [
        'news', 'time', 'post', 'verge', 'wired', 'guardian', 'forbes', 'huffington',
        'cnet', 'engadget', 'gizmodo', 'mashable', 'techcrunch', 'quora', 'behance',
        'dribbble', 'journal', 'sourceforge', 'softonic', 'digg', 'entrepreneur',
        'fast', 'psychology', 'slide', 'slate', 'about', 'producthunt', 'crunchbase',
        'getapp', 'pcmag', 'android', 'inc', 'pc', 'venture', 'stripe', 'business',
        'make', 'artstation', 'atlassian', 'smashing', 'register', 'geekwire',
        'tech', 'freecodecamp', 'techrepublic', 'hackernoon', 'alternativeto',
        'sitepoint', 'yourstory', 'infoworld', 'instapaper', 'goodfirms',
        'addictive', 'siliconangle', 'towards', 'get-app', 'codeproject', 'mac',
        'media', 'g2', 'read', 'biggerpockets', 'solo', 'activesearch', 'webwiki',
        'e27', 'aapsense', 'dealroom', 'getting-smart', 'software-world', 'sitejabber',
        'alternative-me'
    ];

    const name = directory.name.toLowerCase();
    return newsKeywords.some(keyword => name.includes(keyword));
}

// Function to determine if a submission URL is valid (not fake)
function isValidSubmissionUrl(submissionUrl) {
    if (!submissionUrl) return false;

    // Check if it's a real submission URL pattern
    const validPatterns = [
        /\/submit$/,
        /\/add/,
        /\/new/,
        /\/create/,
        /\/signup/,
        /\/register/,
        /\/join/,
        /\/claim/,
        /\/post/,
        /\/apply/
    ];

    return validPatterns.some(pattern => pattern.test(submissionUrl));
}

// Process directories
const results = [];

for (const directory of data.directories) {
    // Skip news sites that don't accept business submissions
    if (isNewsSiteWithoutBusinessSubmissions(directory)) {
        continue;
    }

    // Check if it has a valid submission URL
    if (directory.submissionUrl && isValidSubmissionUrl(directory.submissionUrl)) {
        results.push({
            id: directory.id,
            name: directory.name,
            correct_submission_url: directory.submissionUrl
        });
    }
}

// Generate CSV
let csv = 'id,name,correct_submission_url\n';
for (const result of results) {
    csv += `"${result.id}","${result.name}","${result.correct_submission_url}"\n`;
}

// Write to file
fs.writeFileSync('submission-urls.csv', csv);

console.log(`Processed ${data.directories.length} directories`);
console.log(`Found ${results.length} valid business submission URLs`);
console.log('CSV saved to submission-urls.csv');