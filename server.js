// import express from 'express';
const express = require('express');
// import dotenv from 'dotenv';
const dotenv = require('dotenv');
// import cors from 'cors';
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const app = express();
const port = 3001;
const openai = new OpenAI({apiKey:process.env.OPENAI_API_KEY})
dotenv.config()
app.use(cors());
app.use(express.json());



const readJsonFile = (filePath) => {
    try {
      const rawData = fs.readFileSync(filePath);
      const parsedData = JSON.parse(rawData);
      return parsedData;
    } catch (error) {
      console.error(`An error occurred while reading ${filePath}:`, error);
      return null;
    }
  };
  
  const consolidatePlans = () => {
    try {
      const dirPath = './assets/';
      const allPlans = [];
  
      // Read all file names in the directory
      const files = fs.readdirSync(dirPath);
  
      // Loop through each file to read and consolidate plans
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileData = readJsonFile(filePath);
        
        if (fileData && fileData.plans && Array.isArray(fileData.plans)) {
          const serviceType = path.basename(file, path.extname(file));  // Use filename as serviceType
          
          // Map over each plan object to add the serviceType and make any other changes
          const plansWithType = fileData.plans.map(plan => {
            return {
              ...plan,
              serviceType,
              // Add any other transformations you want here. For example:
              // priceInCents: parseInt(plan.price.replace('$', '')) * 100
            };
          });
  
          allPlans.push(...plansWithType);
        }
      }
  
      return allPlans;
    } catch (error) {
      console.error(error);
      throw new Error('Something went wrong');
    }
  };
  // Route to get consolidated plans
  const buildUserMessage = (userDecisions) => {
    let messageParts = [];
  
    // Conditionally add parts to the message
    if (userDecisions.selectedDiagnosis) {
      messageParts.push(`Our first focus is ${userDecisions.selectedDiagnosis}`);
    }
    if (userDecisions.objective) {
      messageParts.push(`our objective is to ${userDecisions.objective}`);
    }
    if (userDecisions.d1) {
      messageParts.push(`My business is different than others because of ${userDecisions.d1}`);
    }
    if (userDecisions.d2) {
      messageParts.push(`Our unique value proposition is ${userDecisions.body.d1}`);
    }
    if (userDecisions.l1) {
      messageParts.push(`our major cost drivers are ${userDecisions.l1}`);
    }
    if (userDecisions.l2) {
      messageParts.push(`Our cost-saving measure is ${userDecisions.l2}`);
    }
    if (userDecisions.t1) {
      messageParts.push(`Our target audience is ${userDecisions.t1}`);
    }
    if (userDecisions.t2) {
      messageParts.push(`The channels that have been most effictive are ${userDecisions.t2}`);
    }
    if (userDecisions.budget) {
      messageParts.push(`Most importantly our budget is ${userDecisions.budget}`);
    }
    return `The users' decisions concluded to the following: ${messageParts.join(', ')}`;
  }
  

  app.post('/completed-form', async (req, res) => {
    try {
      console.log(req.body)
      // Get the user's decisions from the request body
      const userDecisions = req.body;
      console.log(`attempting to log ${userDecisions}`)
      // Get the consolidated plans
      const allPlans = consolidatePlans();
  
      // Create the message for OpenAI API
      const systemMessage = "Based on the users' decisions, make the executive decision of which marketing plan fits their needs best.";
      const userMessage = buildUserMessage(userDecisions);
      const plansMessage = `Here are the available plans: ${JSON.stringify(allPlans)}`;
      console.log(userMessage)
      // Generate the response from OpenAI
      const completion = await openai.chat.completions.create({
        messages: [
          { "role": "system", "content": systemMessage },
          { "role": "user", "content": userMessage },
          { "role": "assistant", "content": plansMessage }
        ],
        model: "gpt-3.5-turbo"
      });
  
      // Extract the response
      const response = completion.choices[0].message.content;
  
      // Send the response back to the client
      res.json({ message: response });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });