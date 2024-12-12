import inquirer from 'inquirer';
import { exec } from 'child_process';
import fs from 'fs';

async function setup() {
  try {
    // asjk or API 
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'EXA_API_KEY',
        message: 'Enter your Exa API Key:',
        validate: (input) => input ? true : 'API Key is required!',
      },
      {
        type: 'input',
        name: 'NINJA_API_KEY',
        message: 'Enter your Ninja API Key:',
        validate: (input) => input ? true : 'API Key is required!',
      }
    ]);

    // Write to .env 
    const envContent = `
    EXA_API_KEY=${answers.EXA_API_KEY}
    NINJA_API_KEY=${answers.NINJA_API_KEY}
    `;
    
    fs.writeFileSync('.env', envContent.trim());

    console.log('Starting Docker containers...');
    // docker-compose up --build ?? -d
    exec('docker-compose up --build -d', (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${stderr}`);
        return;
      }

      console.log(stdout); 

      
      setTimeout(() => {
        console.log("Containers started.");
      }, 10000); // 10 sec? too long
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

setup();
