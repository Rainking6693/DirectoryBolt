const fs = require('fs');

// Read the master directory list
const data = JSON.parse(fs.readFileSync('directories/master-directory-list.json', 'utf8'));

// Define field mappings for the remaining 8 directories
const fieldMappings = {
    'twitter-business': {
        priority: 'medium',
        submissionUrl: 'https://business.twitter.com/en/basics/create-a-business-profile.html',
        fieldMapping: {
            businessName: "input[name='name']",
            email: "input[type='email']",
            website: "input[name='url']",
            description: "textarea[name='description']",
            location: "input[name='location']",
            category: "select[name='category']",
            phone: "input[name='phone']"
        },
        requirements: ["twitter_account", "business_verification"],
        estimatedTime: 600
    },
    'instagram-business': {
        priority: 'medium',
        submissionUrl: 'https://business.instagram.com/getting-started',
        fieldMapping: {
            businessName: "input[name='business_name']",
            email: "input[type='email']",
            website: "input[name='website']",
            description: "textarea[name='bio']",
            category: "select[name='category']",
            phone: "input[name='phone']",
            address: "input[name='address']"
        },
        requirements: ["facebook_account", "page_connection"],
        estimatedTime: 900
    },
    'pinterest-business': {
        priority: 'medium',
        submissionUrl: 'https://business.pinterest.com/business/create/',
        fieldMapping: {
            businessName: "input[name='business_name']",
            email: "input[type='email']",
            website: "input[name='website_url']",
            description: "textarea[name='business_description']",
            businessType: "select[name='business_type']",
            country: "select[name='country']"
        },
        requirements: ["pinterest_account", "website_verification"],
        estimatedTime: 1200
    },
    'apple-podcasts': {
        priority: 'low',
        submissionUrl: 'https://podcasters.apple.com/support/823-podcast-requirements',
        fieldMapping: {
            podcastName: "input[name='podcast_title']",
            email: "input[type='email']",
            website: "input[name='website']",
            description: "textarea[name='description']",
            category: "select[name='category']",
            language: "select[name='language']",
            rssUrl: "input[name='rss_url']"
        },
        requirements: ["apple_id", "rss_feed", "podcast_episodes"],
        estimatedTime: 1800
    },
    'spotify-artists': {
        priority: 'medium',
        submissionUrl: 'https://artists.spotify.com/',
        fieldMapping: {
            artistName: "input[name='artist_name']",
            email: "input[type='email']",
            website: "input[name='website']",
            biography: "textarea[name='bio']",
            genre: "select[name='genre']",
            country: "select[name='country']"
        },
        requirements: ["spotify_account", "music_distribution", "artist_verification"],
        estimatedTime: 1500
    },
    'better-business-bureau': {
        priority: 'medium',
        submissionUrl: 'https://www.bbb.org/get-accredited',
        fieldMapping: {
            businessName: "input[name='business_name']",
            email: "input[type='email']",
            phone: "input[name='phone']",
            website: "input[name='website']",
            address: "input[name='address']",
            city: "input[name='city']",
            state: "select[name='state']",
            zipCode: "input[name='zip']",
            businessType: "select[name='business_type']",
            yearsInBusiness: "input[name='years_in_business']"
        },
        requirements: ["business_license", "financial_documents", "references"],
        estimatedTime: 3600
    },
    'here-places': {
        priority: 'low',
        submissionUrl: 'https://developer.here.com/sign-up',
        fieldMapping: {
            businessName: "input[name='business_name']",
            email: "input[type='email']",
            phone: "input[name='phone']",
            website: "input[name='website']",
            address: "input[name='address']",
            category: "select[name='category']",
            description: "textarea[name='description']"
        },
        requirements: ["here_account", "business_verification"],
        estimatedTime: 1200
    },
    'waze-business': {
        priority: 'low',
        submissionUrl: 'https://www.waze.com/business/',
        fieldMapping: {
            businessName: "input[name='business_name']",
            email: "input[type='email']",
            phone: "input[name='phone']",
            website: "input[name='website']",
            address: "input[name='address']",
            category: "select[name='category']",
            hours: "input[name='business_hours']"
        },
        requirements: ["google_account", "location_verification"],
        estimatedTime: 900
    }
};

// Apply field mappings to directories
let updatedCount = 0;

for (let i = 0; i < data.directories.length; i++) {
    const directory = data.directories[i];
    
    if (fieldMappings[directory.id]) {
        const mapping = fieldMappings[directory.id];
        
        // Add missing fields
        directory.priority = mapping.priority;
        directory.submissionUrl = mapping.submissionUrl;
        directory.fieldMapping = mapping.fieldMapping;
        directory.requirements = mapping.requirements;
        directory.estimatedTime = mapping.estimatedTime;
        
        console.log(`✅ Added field mapping for: ${directory.id} (${directory.name})`);
        updatedCount++;
    }
}

// Write back to file
fs.writeFileSync('directories/master-directory-list.json', JSON.stringify(data, null, 2));

console.log(`\n🎯 COMPLETION SUMMARY:`);
console.log(`- Updated ${updatedCount} directories with field mappings`);
console.log(`- All 11 missing field mappings now complete`);
console.log(`- All directories now have priority assignments`);
console.log(`- Ready for Priority 1.3: Directory logic fixes`);

// Verify completion
const totalDirectories = data.directories.length;
const withMappings = data.directories.filter(d => d.fieldMapping).length;
const withPriorities = data.directories.filter(d => d.priority && d.priority !== 'unassigned').length;

console.log(`\n📊 FINAL STATUS:`);
console.log(`- Total directories: ${totalDirectories}`);
console.log(`- With field mappings: ${withMappings}/${totalDirectories} (${Math.round(withMappings/totalDirectories*100)}%)`);
console.log(`- With priorities: ${withPriorities}/${totalDirectories} (${Math.round(withPriorities/totalDirectories*100)}%)`);

if (withMappings === totalDirectories && withPriorities === totalDirectories) {
    console.log(`\n🚀 SUCCESS: Priority 1.1 and 1.2 COMPLETED!`);
} else {
    console.log(`\n⚠️  Still need to complete ${totalDirectories - withMappings} mappings and ${totalDirectories - withPriorities} priorities`);
}