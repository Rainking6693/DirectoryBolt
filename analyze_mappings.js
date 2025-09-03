const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('directories/master-directory-list.json', 'utf8'));
    
    const withMapping = data.directories.filter(d => d.fieldMapping);
    const withoutMapping = data.directories.filter(d => !d.fieldMapping);
    
    console.log('=== FIELD MAPPING ANALYSIS ===');
    console.log('Total directories:', data.directories.length);
    console.log('With field mappings:', withMapping.length);
    console.log('Missing field mappings:', withoutMapping.length);
    console.log('');
    console.log('Directories MISSING field mappings:');
    withoutMapping.forEach((dir, i) => {
        console.log(`${String(i+1).padStart(2, ' ')}. ${dir.id} (${dir.name}) - Priority: ${dir.priority || 'unassigned'}`);
    });
    
    console.log('');
    console.log('HIGH PRIORITY directories missing mappings:');
    const highPriorityMissing = withoutMapping.filter(d => d.priority === 'high');
    if (highPriorityMissing.length > 0) {
        highPriorityMissing.forEach(dir => console.log(`- ${dir.id} (${dir.name})`));
    } else {
        console.log('None - Good!');
    }
    
    console.log('');
    console.log('MEDIUM PRIORITY directories missing mappings:');
    const mediumPriorityMissing = withoutMapping.filter(d => d.priority === 'medium');
    if (mediumPriorityMissing.length > 0) {
        mediumPriorityMissing.forEach(dir => console.log(`- ${dir.id} (${dir.name})`));
    } else {
        console.log('None');
    }
    
    console.log('');
    console.log('UNASSIGNED PRIORITY directories missing mappings:');
    const unassignedMissing = withoutMapping.filter(d => !d.priority || d.priority === 'unassigned');
    if (unassignedMissing.length > 0) {
        unassignedMissing.forEach(dir => console.log(`- ${dir.id} (${dir.name})`));
    } else {
        console.log('None');
    }
    
} catch (error) {
    console.error('Error reading file:', error.message);
}