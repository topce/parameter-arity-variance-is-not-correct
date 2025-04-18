const { promises: fs } = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

/**
 * Process all .d.ts files in the bin directory with typescript-callback-transformer
 */
async function processTypeScriptDeclarations() {
  try {
    // Path to bin directory containing the .d.ts files
    const binDirectory = path.join(__dirname, 'bin');
    
    console.log(`Processing .d.ts files in ${binDirectory}...`);
    
    // Get all files in the bin directory
    const files = await fs.readdir(binDirectory);
    
    // Filter for .d.ts files
    const dtsFiles = files.filter(file => file.endsWith('.d.ts'));
    
    console.log(`Found ${dtsFiles.length} .d.ts files to process.`);
    
    // Process each .d.ts file sequentially
    for (const file of dtsFiles) {
      const filePath = path.join(binDirectory, file);
      console.log(`Processing ${file}...`);
      
      try {
        // Run npx typescript-callback-transformer on the file
        const command = `npx typescript-callback-transformer "${filePath}"`;
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
          console.error(`Error processing ${file}:`, stderr);
        } else {
          console.log(`Successfully processed ${file}`);
          if (stdout.trim()) {
            console.log(`Output: ${stdout.trim()}`);
          }
        }
      } catch (err) {
        console.error(`Failed to process ${file}:`, err.message);
      }
      
      console.log('-----------------------------------');
    }
    
    console.log('All .d.ts files have been processed.');
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

// Execute the main function
processTypeScriptDeclarations();
